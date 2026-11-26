import { apiClient } from "@/services/apiClient";
import { extractQuestionText } from "@/services/questionImportService";
import { storageService } from "@/services/storageService";

export type StudentUploadStatus = "pending_review" | "approved" | "rejected" | "indexed";

export interface StudentLibraryUpload {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  fileName: string;
  mimeType: string;
  size: number;
  submittedAt: string;
  status: StudentUploadStatus;
  extractedText?: string;
  corpusId?: string;
  file: Blob;
}

interface SaveStudentUploadInput {
  userId: string;
  userName?: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  file: File;
}

const DATABASE_NAME = "edumind-library";
const DATABASE_VERSION = 1;
const STORE_NAME = "student-uploads";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Trình duyệt này chưa hỗ trợ lưu tài liệu."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không mở được kho tài liệu."));
    request.onblocked = () => reject(new Error("Kho tài liệu đang được dùng ở một thẻ trình duyệt khác."));
  });
}

async function extractUploadTextForAiCorpus(file: File, title: string, subject: string, description: string): Promise<string> {
  try {
    const raw = await extractQuestionText(file);
    if (raw && raw.trim().length > 15) {
      return raw.trim().slice(0, 20000);
    }
  } catch {
    // Nếu là định dạng .doc cũ hoặc PDF scan ảnh chưa có lớp text, ghi nhận metadata chi tiết cho kho dữ liệu AI
  }
  return `Tài liệu học tập: ${title.trim()} (Môn: ${subject.trim()}). ${description.trim() || "Tài liệu do sinh viên đóng góp vào thư viện và kho dữ liệu huấn luyện EduMind AI."}`;
}

export async function saveStudentUpload(input: SaveStudentUploadInput): Promise<StudentLibraryUpload> {
  const uploadId = crypto.randomUUID();
  const extractedText = await extractUploadTextForAiCorpus(
    input.file,
    input.title,
    input.subject,
    input.description,
  );

  // 1. Đồng bộ tài liệu và văn bản trích xuất sang Kho dữ liệu Huấn luyện AI (Backend & Local Corpus)
  let remoteStatus: StudentUploadStatus = "pending_review";
  let corpusId = uploadId;

  storageService.saveCorpusDocument({
    id: uploadId,
    uploaderId: input.userId,
    uploaderName: input.userName || "Học viên EduMind",
    uploaderRole: "student",
    title: input.title.trim(),
    description: input.description.trim(),
    subject: input.subject.trim(),
    category: input.category,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    fileSize: input.file.size,
    extractedText,
    status: "pending_review",
  });

  try {
    const remoteDoc = await apiClient.uploadCorpusDocument({
      id: uploadId,
      title: input.title.trim(),
      description: input.description.trim(),
      subject: input.subject.trim(),
      category: input.category,
      fileName: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      fileSize: input.file.size,
      extractedText,
    });
    corpusId = remoteDoc.id;
    remoteStatus = (remoteDoc.status as StudentUploadStatus) || "pending_review";
  } catch {
    // Nếu backend offline, đã lưu trong storageService.saveCorpusDocument
  }

  // 2. Lưu tệp Blob vào IndexedDB để xem trước nhanh trên trình duyệt
  const database = await openDatabase();
  const upload: StudentLibraryUpload = {
    id: uploadId,
    userId: input.userId,
    title: input.title.trim(),
    description: input.description.trim(),
    subject: input.subject.trim(),
    category: input.category,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: input.file.size,
    submittedAt: new Date().toISOString(),
    status: remoteStatus,
    extractedText,
    corpusId,
    file: input.file,
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).add(upload);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Không lưu được tài liệu."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Việc lưu tài liệu đã bị hủy."));
    });
    return upload;
  } finally {
    database.close();
  }
}

export async function getStudentUploads(userId: string): Promise<StudentLibraryUpload[]> {
  const database = await openDatabase();
  let localUploads: StudentLibraryUpload[] = [];
  try {
    localUploads = await new Promise<StudentLibraryUpload[]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).index("userId").getAll(userId);
      request.onsuccess = () => {
        const uploads = request.result as StudentLibraryUpload[];
        resolve(uploads.sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)));
      };
      request.onerror = () => reject(request.error ?? new Error("Không tải được tài liệu đã gửi."));
    });
  } finally {
    database.close();
  }

  // Đồng bộ trạng thái duyệt từ Kho dữ liệu AI (Backend hoặc LocalStorage Corpus)
  try {
    const remoteCorpus = await apiClient.getCorpusDocuments("all");
    const statusMap = new Map(remoteCorpus.map((d) => [d.id, d.status as StudentUploadStatus]));
    return localUploads.map((item) => ({
      ...item,
      status: statusMap.get(item.corpusId || item.id) || item.status,
    }));
  } catch {
    const localCorpus = storageService.getCorpusDocuments();
    const statusMap = new Map(localCorpus.map((d) => [d.id, d.status as StudentUploadStatus]));
    return localUploads.map((item) => ({
      ...item,
      status: statusMap.get(item.corpusId || item.id) || item.status,
    }));
  }
}
