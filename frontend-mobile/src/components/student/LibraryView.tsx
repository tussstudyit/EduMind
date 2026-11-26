"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Course, Material } from "@/types";
import { storageService } from "@/services/storageService";
import { courseDataService } from "@/services/courseDataService";
import { apiClient } from "@/services/apiClient";
import { getStudentUploads, saveStudentUpload, StudentLibraryUpload } from "@/services/libraryUploadService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { getCourseFile, isStoredCourseFile } from "@/services/courseFileUploadService";

type LibraryResource = {
  id: string;
  title: string;
  description: string;
  source: "school" | "external" | "mine";
  sourceName: string;
  subject: string;
  kind: string;
  url: string;
  fileSize?: string;
  courseTitle?: string;
  teacherName?: string;
  updatedAt?: string;
  fileBlob?: Blob;
  fileName?: string;
  status?: StudentLibraryUpload["status"];
};

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toUploadedResource(upload: StudentLibraryUpload): LibraryResource {
  return {
    id: upload.id,
    title: upload.title,
    description: upload.description || "Tài liệu do bạn tải lên thư viện EduMind.",
    source: "mine",
    sourceName: "Bạn đã tải lên",
    subject: upload.subject,
    kind: upload.category,
    url: "",
    fileSize: formatFileSize(upload.size),
    updatedAt: upload.submittedAt,
    fileBlob: upload.file,
    fileName: upload.fileName,
    status: upload.status,
  };
}

const externalResources: LibraryResource[] = [
  {
    id: "external-python-tutorial",
    title: "Hướng dẫn Python chính thức",
    description: "Tài liệu nhập môn về cú pháp, kiểu dữ liệu, cấu trúc điều khiển và module Python.",
    source: "external",
    sourceName: "Python.org",
    subject: "Lập trình",
    kind: "Tài liệu trực tuyến",
    url: "https://docs.python.org/3/tutorial/",
  },
  {
    id: "external-mdn-javascript",
    title: "JavaScript Guide",
    description: "Hướng dẫn JavaScript từ nền tảng ngôn ngữ đến các khái niệm nâng cao.",
    source: "external",
    sourceName: "MDN Web Docs",
    subject: "Phát triển web",
    kind: "Tài liệu trực tuyến",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  },
  {
    id: "external-pytorch-learn",
    title: "Learn the Basics: PyTorch",
    description: "Chuỗi bài học thực hành về tensor, dữ liệu, xây dựng mô hình và tối ưu hóa.",
    source: "external",
    sourceName: "PyTorch.org",
    subject: "Trí tuệ nhân tạo",
    kind: "Hướng dẫn trực tuyến",
    url: "https://pytorch.org/tutorials/beginner/basics/intro.html",
  },
  {
    id: "external-khan-linear-algebra",
    title: "Đại số tuyến tính",
    description: "Bài giảng trực quan về vector, ma trận và các phép biến đổi tuyến tính.",
    source: "external",
    sourceName: "Khan Academy",
    subject: "Toán học",
    kind: "Khóa học trực tuyến",
    url: "https://www.khanacademy.org/math/linear-algebra",
  },
];

function toSchoolResource(material: Material, course: Course): LibraryResource {
  return {
    id: material.id,
    title: material.title,
    description: material.description || "Tài liệu do giảng viên chia sẻ trong lớp học.",
    source: "school",
    sourceName: "EduMind · Trong trường",
    subject: course.subjectName,
    kind: material.fileType.toUpperCase(),
    url: material.fileUrl,
    fileSize: material.fileSize,
    courseTitle: course.title,
    teacherName: course.teacherName,
    updatedAt: material.uploadedAt,
  };
}

export function LibraryView({ onBrowseClasses }: { onBrowseClasses: () => void }) {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const [resources, setResources] = useState<LibraryResource[]>(externalResources);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<"all" | "school" | "external" | "mine" | "saved">("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Ghi chú học tập");
  const [uploadDescription, setUploadDescription] = useState("");
  const [confirmedRights, setConfirmedRights] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [activeEnrollments, publishedCourses, allMaterials] = await Promise.all([
        courseDataService.getEnrollments("student", currentUser.id),
        courseDataService.getCourses("student", currentUser.id),
        courseDataService.getMaterials(),
      ]);
      const activeCourseIds = new Set(activeEnrollments
        .filter((enrollment) => enrollment.status === "active")
        .map((enrollment) => enrollment.courseId));
      const enrolledCourses = publishedCourses.filter((course) => activeCourseIds.has(course.id));
      const schoolResources = enrolledCourses.flatMap((course) =>
        allMaterials.filter((m) => m.courseId === course.id).map((item) => toSchoolResource(item, course)),
      );
      if (!mounted) return;
      setResources([...schoolResources, ...externalResources]);
      setSavedIds(storageService.getSavedLibraryItems());
      try {
        const uploads = await getStudentUploads(currentUser.id);
        if (mounted) setResources([...uploads.map(toUploadedResource), ...schoolResources, ...externalResources]);
      } catch {
        if (mounted) error("Không tải được tài liệu đã gửi", "Bạn vẫn có thể tiếp tục dùng thư viện và thử tải lại trang.");
      }
    };
    void load().catch((err) => {
      if (mounted) error("Không tải được khóa học đã tham gia", err instanceof Error ? err.message : "Vui lòng thử lại.");
    });
    return () => { mounted = false; };
  }, [currentUser.id, error]);

  const subjects = useMemo(() => Array.from(new Set(resources.map((resource) => resource.subject))).sort(), [resources]);
  const visibleResources = useMemo(() => resources.filter((resource) => {
    const matchesSource = sourceFilter === "all" || (sourceFilter === "saved" ? savedIds.includes(resource.id) : resource.source === sourceFilter);
    const matchesSubject = subjectFilter === "all" || resource.subject === subjectFilter;
    const query = search.trim().toLocaleLowerCase("vi");
    const matchesSearch = !query || [resource.title, resource.description, resource.subject, resource.sourceName, resource.courseTitle || ""]
      .some((value) => value.toLocaleLowerCase("vi").includes(query));
    return matchesSource && matchesSubject && matchesSearch;
  }), [resources, savedIds, sourceFilter, subjectFilter, search]);

  const toggleSaved = (resourceId: string) => {
    storageService.toggleSavedLibraryItem(resourceId);
    setSavedIds(storageService.getSavedLibraryItems());
  };

  const filters: Array<{ id: typeof sourceFilter; label: string }> = [
    { id: "all", label: `Tất cả (${resources.length})` },
    { id: "school", label: `Trong trường (${resources.filter((item) => item.source === "school").length})` },
    { id: "external", label: `Ngoài trường (${resources.filter((item) => item.source === "external").length})` },
    { id: "mine", label: `Đã tải lên (${resources.filter((item) => item.source === "mine").length})` },
    { id: "saved", label: `Đã lưu (${savedIds.length})` },
  ];

  const resetUploadForm = () => {
    setUploadStep(1);
    setSelectedFile(null);
    setUploadTitle("");
    setUploadSubject("");
    setUploadCategory("Ghi chú học tập");
    setUploadDescription("");
    setConfirmedRights(false);
  };

  const closeUpload = () => {
    setIsUploadOpen(false);
    resetUploadForm();
  };

  const chooseFile = (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      error("Định dạng chưa được hỗ trợ", "Chọn tệp PDF, DOC hoặc DOCX.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      error("Tệp vượt quá dung lượng cho phép", "Mỗi tài liệu có thể tải lên tối đa 25 MB.");
      return;
    }
    setSelectedFile(file);
    if (!uploadTitle.trim()) setUploadTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  const submitUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !confirmedRights || !uploadTitle.trim() || !uploadSubject.trim()) return;
    setIsSavingUpload(true);
    try {
      const upload = await saveStudentUpload({
        userId: currentUser.id,
        userName: currentUser.name,
        title: uploadTitle,
        subject: uploadSubject,
        category: uploadCategory,
        description: uploadDescription,
        file: selectedFile,
      });
      setResources((current) => [toUploadedResource(upload), ...current]);
      setSourceFilter("mine");
      setUploadStep(3);
      success("Đã tải lên & đồng bộ Kho dữ liệu AI", "Tài liệu đã được trích xuất văn bản gửi vào hàng đợi kiểm duyệt Kho tri thức AI (AI Corpus).");
    } catch (uploadError) {
      error("Chưa thể lưu tài liệu", uploadError instanceof Error ? uploadError.message : "Hãy thử lại sau.");
    } finally {
      setIsSavingUpload(false);
    }
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header className="section-heading" style={{ margin: 0, alignItems: "center" }}>
        <div>
          <span className="eyebrow">KHÔNG GIAN TÀI LIỆU CỦA BẠN</span>
          <h2 style={{ marginBottom: 5 }}>Thư viện học tập</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Tìm tài liệu trong lớp đã tham gia và nguồn học tập bên ngoài trường.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" onClick={() => setIsUploadOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 9, border: 0, background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            <Icon name="upload" size={16} /> Tải tài liệu lên
          </button>
          <button type="button" onClick={onBrowseClasses} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 9, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", fontWeight: 700, cursor: "pointer" }}>
            <Icon name="users" size={16} /> Xem lớp học
          </button>
        </div>
      </header>

      <div style={{ padding: 20, borderRadius: 14, background: "linear-gradient(120deg,#eef2ff,#f5f3ff 55%,#ecfeff)", border: "1px solid #e0e7ff" }}>
        <div style={{ fontSize: 18, fontWeight: 750, color: "#1e293b" }}>Một nơi để gom tài liệu học tập</div>
        <p style={{ margin: "6px 0 0", maxWidth: 670, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>Lưu tài liệu quan trọng để xem lại nhanh. Tài liệu lớp học chỉ xuất hiện khi bạn đã tham gia lớp; nguồn bên ngoài mở tại trang cung cấp.</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        {filters.map((filter) => (
          <button key={filter.id} type="button" onClick={() => setSourceFilter(filter.id)} style={{ padding: "8px 12px", borderRadius: 999, border: sourceFilter === filter.id ? "1px solid #4f46e5" : "1px solid #e2e8f0", background: sourceFilter === filter.id ? "#eef2ff" : "#fff", color: sourceFilter === filter.id ? "#4338ca" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {filter.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 260px", minWidth: 200 }}>
          <Icon name="search" size={16} />
          <input aria-label="Tìm tài liệu" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên tài liệu, môn học hoặc lớp..." style={{ width: "100%", border: 0, outline: 0, fontSize: 13 }} />
        </div>
        <select aria-label="Lọc theo môn học" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", background: "#fff", fontSize: 12 }}>
          <option value="all">Tất cả môn học</option>
          {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
        </select>
      </div>

      {visibleResources.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
          {visibleResources.map((resource) => {
            const saved = savedIds.includes(resource.id);
            return (
              <article key={resource.id} style={{ display: "flex", flexDirection: "column", minHeight: 205, padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", boxShadow: "0 5px 16px rgba(15,23,42,.035)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 999, background: resource.source === "school" ? "#ecfdf5" : resource.source === "mine" ? "#f5f3ff" : "#eff6ff", color: resource.source === "school" ? "#047857" : resource.source === "mine" ? "#6d28d9" : "#1d4ed8", fontSize: 10, fontWeight: 750 }}>
                    <Icon name={resource.source === "school" ? "book" : resource.source === "mine" ? "upload" : "arrow"} size={12} /> {resource.source === "school" ? "Trong trường" : resource.source === "mine" ? "Bạn đã tải lên" : "Ngoài trường"}
                  </span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); toggleSaved(resource.id); }} aria-label={saved ? "Bỏ lưu tài liệu" : "Lưu tài liệu"} title={saved ? "Bỏ lưu" : "Lưu tài liệu"} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 8, background: saved ? "#fffbeb" : "#fff", color: saved ? "#d97706" : "#64748b", cursor: "pointer" }}>
                    <Icon name="star" size={15} />
                  </button>
                </div>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{resource.subject} · {resource.kind}</div>
                <button type="button" onClick={() => setSelectedResource(resource)} style={{ margin: "6px 0", padding: 0, border: 0, background: "none", color: "#1e293b", fontSize: 15, fontWeight: 750, lineHeight: 1.4, textAlign: "left", cursor: "pointer" }}>{resource.title}</button>
                <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.55 }}>{resource.description}</p>
                {resource.status === "pending_review" && <span style={{ alignSelf: "flex-start", marginTop: 9, padding: "4px 8px", borderRadius: 999, background: "#fffbeb", color: "#b45309", fontSize: 10, fontWeight: 750 }}>Chờ duyệt vào Kho AI</span>}
                {(resource.status === "approved" || resource.status === "indexed") && <span style={{ alignSelf: "flex-start", marginTop: 9, padding: "4px 8px", borderRadius: 999, background: "#cffafe", color: "#0e7490", fontSize: 10, fontWeight: 750 }}>✓ Đã nạp vào Kho dữ liệu AI</span>}
                <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ minWidth: 0, color: "#94a3b8", fontSize: 10 }}>
                    <div>{resource.sourceName}</div>
                    {resource.courseTitle && <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{resource.courseTitle}</div>}
                  </div>
                  <button type="button" onClick={() => setSelectedResource(resource)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 11px", border: 0, borderRadius: 8, background: "#4f46e5", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Icon name="eye" size={13} /> Xem trước</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "48px 20px", textAlign: "center", background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 12 }}>
          <div style={{ display: "grid", placeItems: "center", width: 46, height: 46, margin: "0 auto 12px", borderRadius: 14, background: "#eef2ff", color: "#4f46e5" }}><Icon name="book" size={22} /></div>
          <strong style={{ color: "#334155", fontSize: 14 }}>{sourceFilter === "school" ? "Chưa có tài liệu lớp học" : "Chưa tìm thấy tài liệu phù hợp"}</strong>
          <p style={{ color: "#64748b", fontSize: 12, margin: "6px 0 14px" }}>{sourceFilter === "school" ? "Tham gia một lớp để xem các tài liệu do giảng viên chia sẻ." : "Thử từ khóa hoặc bộ lọc khác."}</p>
          {sourceFilter === "school" && <button type="button" onClick={onBrowseClasses} style={{ padding: "8px 12px", border: 0, borderRadius: 8, background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Tìm lớp học</button>}
        </div>
      )}

      {selectedResource && (
        <DocumentPreview
          resource={selectedResource}
          isSaved={savedIds.includes(selectedResource.id)}
          onToggleSaved={() => toggleSaved(selectedResource.id)}
          onClose={() => setSelectedResource(null)}
        />
      )}

      <Modal isOpen={isUploadOpen} onClose={closeUpload} title="Tải tài liệu lên" subtitle="Chia sẻ tài liệu học tập bạn có quyền sử dụng" maxWidth="680px">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {["Chọn tệp", "Thông tin", "Hoàn tất"].map((label, index) => {
            const step = (index + 1) as 1 | 2 | 3;
            const active = uploadStep >= step;
            return <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: active ? "#4f46e5" : "#94a3b8", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                <span style={{ display: "grid", placeItems: "center", width: 23, height: 23, borderRadius: 999, background: active ? "#eef2ff" : "#f1f5f9" }}>{step}</span>{label}
              </div>
              {index < 2 && <div style={{ height: 1, flex: 1, background: uploadStep > step ? "#a5b4fc" : "#e2e8f0" }} />}
            </React.Fragment>;
          })}
        </div>

        {uploadStep === 1 && <div>
          <label htmlFor="student-library-file" style={{ display: "flex", minHeight: 190, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 20, border: "1.5px dashed #a5b4fc", borderRadius: 12, background: "#fafaff", textAlign: "center", cursor: "pointer" }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: "#eef2ff", color: "#4f46e5" }}><Icon name="upload" size={23} /></span>
            <strong style={{ color: "#1e293b", fontSize: 14 }}>{selectedFile ? selectedFile.name : "Chọn tài liệu từ thiết bị"}</strong>
            <span style={{ color: "#64748b", fontSize: 12 }}>PDF, DOC hoặc DOCX · tối đa 25 MB</span>
            {selectedFile && <span style={{ color: "#4f46e5", fontSize: 11, fontWeight: 700 }}>{formatFileSize(selectedFile.size)} · Nhấn để đổi tệp</span>}
          </label>
          <input id="student-library-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => chooseFile(event.target.files?.[0])} style={{ display: "none" }} />
          <div style={{ marginTop: 13, padding: 12, borderRadius: 9, background: "#f8fafc", color: "#64748b", fontSize: 11, lineHeight: 1.6 }}>Hệ thống sẽ tự động trích xuất văn bản của tệp để đồng bộ lên Kho dữ liệu AI (AI Corpus) trên máy chủ và lưu bản xem trước trong trình duyệt. Sau khi Quản trị viên / Giảng viên duyệt, tài liệu sẽ được lập chỉ mục huấn luyện cho AI Tutor.</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button type="button" disabled={!selectedFile} onClick={() => setUploadStep(2)} style={{ padding: "10px 16px", border: 0, borderRadius: 8, background: selectedFile ? "#4f46e5" : "#cbd5e1", color: "#fff", fontWeight: 700, cursor: selectedFile ? "pointer" : "not-allowed" }}>Tiếp tục</button>
          </div>
        </div>}

        {uploadStep === 2 && <form onSubmit={submitUpload}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, color: "#475569", fontSize: 12, fontWeight: 650 }}>Tên tài liệu *
              <input required value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} maxLength={120} placeholder="Ví dụ: Đề cương môn Cấu trúc dữ liệu" style={{ padding: "10px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: "grid", gap: 6, color: "#475569", fontSize: 12, fontWeight: 650 }}>Môn học *
              <input required value={uploadSubject} onChange={(event) => setUploadSubject(event.target.value)} maxLength={80} placeholder="Ví dụ: Cấu trúc dữ liệu" style={{ padding: "10px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: "grid", gap: 6, color: "#475569", fontSize: 12, fontWeight: 650 }}>Loại tài liệu
              <select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} style={{ padding: "10px 11px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#334155", fontSize: 13 }}>
                <option>Ghi chú học tập</option><option>Bài tập có lời giải</option><option>Đề thi / đề cương</option><option>Bài thuyết trình</option><option>Tài liệu tham khảo</option><option>Khác</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, color: "#475569", fontSize: 12, fontWeight: 650 }}>Mô tả
              <input value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} maxLength={240} placeholder="Nội dung chính hoặc học kỳ" style={{ padding: "10px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }} />
            </label>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 16, padding: 12, border: "1px solid #e2e8f0", borderRadius: 9, color: "#475569", fontSize: 11, lineHeight: 1.55 }}>
            <input type="checkbox" checked={confirmedRights} onChange={(event) => setConfirmedRights(event.target.checked)} style={{ marginTop: 2 }} />
            <span>Tôi xác nhận tài liệu do tôi tạo hoặc tôi có quyền chia sẻ; tài liệu không vi phạm bản quyền hay quyền riêng tư của người khác.</span>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
            <button type="button" onClick={() => setUploadStep(1)} style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", fontWeight: 650, cursor: "pointer" }}>Quay lại</button>
            <button type="submit" disabled={isSavingUpload || !confirmedRights || !uploadTitle.trim() || !uploadSubject.trim()} style={{ padding: "10px 16px", border: 0, borderRadius: 8, background: isSavingUpload || !confirmedRights || !uploadTitle.trim() || !uploadSubject.trim() ? "#a5b4fc" : "#4f46e5", color: "#fff", fontWeight: 700, cursor: isSavingUpload ? "wait" : "pointer" }}>{isSavingUpload ? "Đang gửi..." : "Gửi tài liệu"}</button>
          </div>
        </form>}

        {uploadStep === 3 && <div style={{ padding: "14px 4px 4px", textAlign: "center" }}>
          <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, margin: "0 auto 12px", borderRadius: 999, background: "#cffafe", color: "#0e7490" }}><Icon name="checkCircle" size={30} /></span>
          <h4 style={{ margin: "0 0 7px", color: "#1e293b", fontSize: 17 }}>Đã nhận tài liệu</h4>
          <p style={{ margin: "0 auto", maxWidth: 430, color: "#64748b", fontSize: 12, lineHeight: 1.65 }}>Tài liệu đang chờ duyệt và hiện chỉ hiển thị trong mục “Đã tải lên” của bạn. Bạn có thể mở bản xem trước hoặc tải lại tệp từ thư viện.</p>
          <button type="button" onClick={closeUpload} style={{ marginTop: 18, padding: "10px 16px", border: 0, borderRadius: 8, background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Về thư viện</button>
        </div>}
      </Modal>
    </section>
  );
}

function DocumentPreview({
  resource,
  isSaved,
  onToggleSaved,
  onClose,
}: {
  resource: LibraryResource;
  isSaved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [hasFilePreview, setHasFilePreview] = useState(false);
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState(resource.fileName || resource.title);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setHasFilePreview(false);
    setLocalFileUrl(null);
    setDownloadFileName(resource.fileName || resource.title);

    const showBlob = (blob: Blob, fileName: string) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setLocalFileUrl(objectUrl);
      setDownloadFileName(fileName);
      setHasFilePreview(true);
    };

    if (resource.fileBlob) {
      showBlob(resource.fileBlob, resource.fileName || resource.title);
    } else if (resource.source === "school" && isStoredCourseFile(resource.url)) {
      if (resource.kind === "VIDEO") {
        apiClient.createMaterialPlaybackUrl(resource.id)
          .then(({ streamUrl }) => {
            if (cancelled) return;
            setLocalFileUrl(streamUrl);
            setDownloadFileName(`${resource.title}.mp4`);
            setHasFilePreview(true);
          })
          .catch(() => undefined);
      } else {
        getCourseFile(resource.id)
          .then((file) => {
            if (file) showBlob(file.blob, file.fileName);
          })
          .catch(() => undefined);
      }
    } else if (resource.source === "school" && /^https?:\/\//i.test(resource.url)) {
      fetch(resource.url, { method: "HEAD" })
        .then((response) => { if (!cancelled) setHasFilePreview(response.ok); })
        .catch(() => { if (!cancelled) setHasFilePreview(false); });
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resource.id, resource.fileBlob, resource.fileName, resource.source, resource.title, resource.url]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [resource.id, resource.source, resource.url, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Xem trước ${resource.title}`} style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", flexDirection: "column", background: "#f1f5f9", color: "#1e293b" }}>
      <header style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 22px", borderBottom: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 2px 8px rgba(15,23,42,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
          <button type="button" onClick={onClose} aria-label="Quay lại thư viện" title="Quay lại thư viện" style={{ display: "grid", placeItems: "center", width: 38, height: 38, flexShrink: 0, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#475569", cursor: "pointer" }}><Icon name="arrowLeft" size={18} /></button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, overflow: "hidden", color: "#111827", fontSize: 17, fontWeight: 750, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resource.title}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 13px", marginTop: 4, color: "#64748b", fontSize: 11 }}>
              <span>{resource.sourceName}</span><span>{resource.subject}</span>{resource.courseTitle && <span>{resource.courseTitle} · {resource.teacherName}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, gap: 7 }}>
          <button type="button" onClick={onToggleSaved} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: 9, background: isSaved ? "#fffbeb" : "#fff", color: isSaved ? "#b45309" : "#475569", fontSize: 12, fontWeight: 650, cursor: "pointer" }}><Icon name="star" size={15} /> {isSaved ? "Đã lưu" : "Lưu"}</button>
          {resource.source === "external" ? (
            <a href={resource.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 11px", borderRadius: 9, background: "#16a34a", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}><Icon name="arrow" size={14} /> Mở nguồn</a>
          ) : (
            <a href={localFileUrl || resource.url} download={downloadFileName || undefined} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 11px", borderRadius: 9, background: "#16a34a", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}><Icon name="download" size={14} /> Tải tài liệu</a>
          )}
          <button type="button" onClick={onClose} aria-label="Đóng bản xem trước" title="Đóng" style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: 0, borderRadius: 9, background: "#f1f5f9", color: "#475569", cursor: "pointer" }}><Icon name="x" size={18} /></button>
        </div>
      </header>

      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 48, borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <span style={{ color: "#64748b", fontSize: 12 }}>Bản xem trước</span>
        <span style={{ width: 1, height: 18, background: "#e2e8f0" }} />
        <button type="button" onClick={() => setZoom((value) => Math.max(75, value - 10))} aria-label="Thu nhỏ" style={{ width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" }}>−</button>
        <span style={{ minWidth: 42, color: "#475569", fontSize: 11, textAlign: "center" }}>{zoom}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(130, value + 10))} aria-label="Phóng to" style={{ width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", color: "#475569", fontSize: 18, cursor: "pointer" }}>+</button>
      </div>

      <main style={{ flex: 1, overflow: "auto", padding: "30px 18px 60px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        {(hasFilePreview || (resource.source === "mine" && resource.kind === "PDF" && !!localFileUrl)) ? (
          resource.kind === "VIDEO" ? (
            <video controls autoPlay src={localFileUrl || resource.url} style={{ width: "min(100%, 1100px)", maxHeight: "calc(100vh - 145px)", borderRadius: 8, background: "#0f172a", boxShadow: "0 8px 30px rgba(15,23,42,.12)" }}>Trình duyệt không hỗ trợ phát video.</video>
          ) : (
            <iframe title={`Bản xem trước: ${resource.title}`} src={localFileUrl || resource.url} style={{ width: "min(100%, 1000px)", height: "calc(100vh - 145px)", border: 0, borderRadius: 8, background: "#fff", boxShadow: "0 8px 30px rgba(15,23,42,.12)" }} />
          )
        ) : (
          <article style={{ boxSizing: "border-box", width: `min(${Math.round(820 * zoom / 100)}px, 100%)`, minHeight: Math.round(1060 * zoom / 100), padding: "72px clamp(28px, 8vw, 78px)", border: "1px solid #e2e8f0", borderRadius: 15, background: "#fff", boxShadow: "0 8px 30px rgba(15,23,42,.09)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: "2px solid #1e293b" }}>
              <div style={{ color: "#4f46e5", fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>EDUMIND AI · THƯ VIỆN HỌC TẬP</div>
              <div style={{ padding: "5px 8px", borderRadius: 6, background: resource.source === "school" ? "#ecfdf5" : resource.source === "mine" ? "#f5f3ff" : "#eff6ff", color: resource.source === "school" ? "#047857" : resource.source === "mine" ? "#6d28d9" : "#1d4ed8", fontSize: 10, fontWeight: 750 }}>{resource.source === "school" ? "TÀI LIỆU TRONG TRƯỜNG" : resource.source === "mine" ? "TÀI LIỆU BẠN ĐÃ TẢI LÊN" : "NGUỒN HỌC TẬP BÊN NGOÀI"}</div>
            </div>
            <div style={{ marginTop: 48 }}>
              <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{resource.subject} · {resource.kind}</div>
              <h2 style={{ margin: "12px 0 18px", color: "#111827", fontSize: 30, lineHeight: 1.25 }}>{resource.title}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 22px", color: "#64748b", fontSize: 12 }}>
                <span><strong style={{ color: "#334155" }}>Nguồn:</strong> {resource.sourceName}</span>
                {resource.courseTitle && <span><strong style={{ color: "#334155" }}>Lớp:</strong> {resource.courseTitle}</span>}
                {resource.teacherName && <span><strong style={{ color: "#334155" }}>Giảng viên:</strong> {resource.teacherName}</span>}
                {resource.fileSize && <span><strong style={{ color: "#334155" }}>Dung lượng:</strong> {resource.fileSize}</span>}
                {resource.fileName && <span><strong style={{ color: "#334155" }}>Tệp gốc:</strong> {resource.fileName}</span>}
              </div>
            </div>
            <div style={{ marginTop: 34, padding: 20, borderLeft: "4px solid #4f46e5", borderRadius: "0 10px 10px 0", background: "#f8fafc" }}>
              <h3 style={{ margin: "0 0 9px", color: "#1e293b", fontSize: 15 }}>Giới thiệu tài liệu</h3>
              <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.8 }}>{resource.description}</p>
            </div>
            <section style={{ marginTop: 38, color: "#334155", fontSize: 14, lineHeight: 1.8 }}>
              <h3 style={{ margin: "0 0 12px", color: "#111827", fontSize: 18 }}>Thông tin xem trước</h3>
              <p style={{ margin: "0 0 14px" }}>{resource.source === "mine" ? "Đây là tài liệu bạn đã gửi lên. Khi đang chờ duyệt, chỉ bạn có thể xem và tải lại tệp này." : "Đây là bản xem trước của tài liệu trong thư viện. Bạn có thể lưu tài liệu vào thư viện cá nhân hoặc mở nguồn gốc để xem nội dung đầy đủ."}</p>
              {resource.source === "mine" && <div style={{ display: "inline-flex", marginTop: 4, padding: "6px 9px", borderRadius: 999, background: resource.status === "pending_review" ? "#fffbeb" : (resource.status === "approved" || resource.status === "indexed") ? "#ecfdf5" : "#fef2f2", color: resource.status === "pending_review" ? "#b45309" : (resource.status === "approved" || resource.status === "indexed") ? "#047857" : "#b91c1c", fontSize: 11, fontWeight: 750 }}>{resource.status === "pending_review" ? "Chờ duyệt vào Kho AI" : (resource.status === "approved" || resource.status === "indexed") ? "✓ Đã nạp vào Kho dữ liệu AI" : "Không được duyệt"}</div>}
              <div style={{ marginTop: 24, padding: 16, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
                <div style={{ color: "#4f46e5", fontSize: 11, fontWeight: 800, letterSpacing: ".06em" }}>TÓM TẮT</div>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>{resource.description}</p>
              </div>
            </section>
            <footer style={{ marginTop: 90, paddingTop: 13, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 10 }}>
              <span>{resource.sourceName}</span><span>EduMind AI · Bản xem trước</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
