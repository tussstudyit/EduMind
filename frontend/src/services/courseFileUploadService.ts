import { apiClient } from "@/services/apiClient";

export interface StoredCourseFile {
  id: string;
  courseId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
}

const DATABASE_NAME = "edumind-course-files";
const DATABASE_VERSION = 1;
const STORE_NAME = "files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Trình duyệt này chưa hỗ trợ lưu tệp khóa học."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không mở được kho tệp khóa học."));
    request.onblocked = () => reject(new Error("Kho tệp đang được dùng ở một thẻ trình duyệt khác."));
  });
}

export const COURSE_FILE_URL_PREFIX = "course-file://";

export function isStoredCourseFile(fileUrl: string): boolean {
  return Boolean(fileUrl && fileUrl.startsWith(COURSE_FILE_URL_PREFIX));
}

export interface ParsedVideoSource {
  provider: "google-drive" | "youtube" | "vimeo" | "server-file" | "direct-video" | "external-iframe";
  label: string;
  embedUrl: string;
  directViewUrl: string;
  isIframe: boolean;
  fileId?: string;
}

export function parseVideoSource(rawUrl?: string | null): ParsedVideoSource | null {
  const url = (rawUrl || "").trim();
  if (!url) return null;

  if (isStoredCourseFile(url)) {
    return {
      provider: "server-file",
      label: "Video tải lên hệ thống (MP4 Stream)",
      embedUrl: url,
      directViewUrl: url,
      isIframe: false,
    };
  }

  // 1. Google Drive links:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID&export=download
  const driveMatch =
    url.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i) ||
    url.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]{10,})/i);

  if (driveMatch?.[1]) {
    const driveId = driveMatch[1];
    return {
      provider: "google-drive",
      label: "Google Drive Video",
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      directViewUrl: `https://drive.google.com/file/d/${driveId}/view`,
      isIframe: true,
      fileId: driveId,
    };
  }

  // 2. YouTube links:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const ytMatch =
    url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch?.[1]) {
    const ytId = ytMatch[1];
    return {
      provider: "youtube",
      label: "YouTube Video",
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
      directViewUrl: `https://www.youtube.com/watch?v=${ytId}`,
      isIframe: true,
      fileId: ytId,
    };
  }

  // 3. Vimeo links:
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i);
  if (vimeoMatch?.[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      provider: "vimeo",
      label: "Vimeo Video",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      directViewUrl: `https://vimeo.com/${vimeoId}`,
      isIframe: true,
      fileId: vimeoId,
    };
  }

  // 4. Direct video file URLs (.mp4, .webm, .mov, .m4v, .ogv, blob:, /api/materials/.../stream)
  if (
    url.startsWith("blob:") ||
    url.startsWith("/api/materials/") ||
    /\.(mp4|webm|mov|m4v|ogv)(?:\?.*)?$/i.test(url)
  ) {
    return {
      provider: "direct-video",
      label: "Trình phát Video HTML5",
      embedUrl: url,
      directViewUrl: url,
      isIframe: false,
    };
  }

  // 5. Fallback for other embeddable URLs (e.g. OneDrive, SharePoint, Loom, Stream)
  if (/^https?:\/\//i.test(url)) {
    return {
      provider: "external-iframe",
      label: "Video liên kết ngoài",
      embedUrl: url,
      directViewUrl: url,
      isIframe: true,
    };
  }

  return null;
}

function ensureFileNameHasExtension(fileName: string, mimeType?: string): string {
  if (/\.[a-z0-9]{2,5}$/i.test(fileName)) return fileName;
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("webm")) return `${fileName}.webm`;
  if (mime.includes("quicktime") || mime.includes("mov")) return `${fileName}.mov`;
  if (mime.includes("pdf")) return `${fileName}.pdf`;
  if (mime.includes("word") || mime.includes("docx")) return `${fileName}.docx`;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return `${fileName}.pptx`;
  if (mime.includes("zip")) return `${fileName}.zip`;
  return `${fileName || "video"}.mp4`;
}

export async function saveCourseFile(id: string, courseId: string, lessonId: string, file: File): Promise<string> {
  const safeName = ensureFileNameHasExtension(file.name, file.type);
  const normalizedFile =
    safeName === file.name ? file : new File([file], safeName, { type: file.type || "video/mp4" });
  const uploaded = await apiClient.uploadMaterialFile(id, courseId, lessonId, normalizedFile);
  return uploaded.fileUrl;
}

async function getLocalCourseFile(id: string): Promise<StoredCourseFile | undefined> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as StoredCourseFile | undefined);
      request.onerror = () => reject(request.error ?? new Error("Không tải được tệp khóa học."));
    });
  } finally {
    database.close();
  }
}

export async function migrateLocalCourseFile(id: string, courseId: string, lessonId: string): Promise<string | undefined> {
  const localFile = await getLocalCourseFile(id);
  if (!localFile) return undefined;

  try {
    if (await apiClient.hasMaterialFile(id)) return undefined;
  } catch {
    // Nếu backend chưa có tệp, thử chuyển bản lưu cũ trên trình duyệt lên máy chủ.
  }

  const safeName = ensureFileNameHasExtension(localFile.fileName || id, localFile.mimeType || localFile.blob?.type);
  const file = new File([localFile.blob], safeName, {
    type: localFile.mimeType || localFile.blob?.type || "video/mp4",
  });
  return saveCourseFile(id, courseId, lessonId, file);
}

export async function getCourseFile(id: string): Promise<StoredCourseFile | undefined> {
  try {
    const remote = await apiClient.getMaterialFile(id);
    return {
      id,
      courseId: "",
      fileName: remote.fileName,
      mimeType: remote.blob.type || "application/octet-stream",
      size: remote.blob.size,
      blob: remote.blob,
    };
  } catch (remoteError) {
    try {
      return await getLocalCourseFile(id);
    } catch {
      throw remoteError;
    }
  }
}

export async function deleteCourseFile(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Không xóa được tệp khóa học."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Việc xóa tệp đã bị hủy."));
    });
  } finally {
    database.close();
  }
}
