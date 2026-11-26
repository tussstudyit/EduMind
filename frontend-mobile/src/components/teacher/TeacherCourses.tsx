// ============================================================================
// EDUMIND AI - TEACHER COURSE & LESSON & ROSTER MANAGER (MODULE 3, 4, 5)
// Giảng viên quản lý khóa học, bài học, tài liệu & danh sách học viên ghi danh
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Course, Lesson, LessonStatus, Material, Enrollment, CourseStatus, CourseLevel, Subject } from "@/types";
import { storageService } from "@/services/storageService";
import { courseDataService } from "@/services/courseDataService";
import {
  deleteCourseFile,
  isStoredCourseFile,
  migrateLocalCourseFile,
  parseVideoSource,
  saveCourseFile,
} from "@/services/courseFileUploadService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { CourseVideoPlayer, VideoPlayableItem } from "@/components/ui/CourseVideoPlayer";

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getMaterialType(file: File): Material["fileType"] {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.type.startsWith("video/") || ["mp4", "mov", "m4v", "webm", "ogv"].includes(extension || "")) return "video";
  if (extension === "pdf") return "pdf";
  if (["ppt", "pptx", "key"].includes(extension || "")) return "slide";
  if (["doc", "docx", "rtf"].includes(extension || "")) return "docx";
  if (["zip", "rar", "7z"].includes(extension || "")) return "zip";
  if (["py", "js", "ts", "tsx", "cpp", "c", "java", "html", "css"].includes(extension || "")) return "code";
  return "pdf";
}

function getCustomSubjectId(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `custom-subject-${slug || "other"}`;
}

export function TeacherCourses() {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"lessons" | "roster" | "settings">("lessons");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedFolderLessonId, setSelectedFolderLessonId] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState("");

  // Modal Tạo / Sửa Khóa học
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [courseFormTitle, setCourseFormTitle] = useState("");
  const [courseFormSubjectName, setCourseFormSubjectName] = useState("");
  const [courseFormDesc, setCourseFormDesc] = useState("");
  const [courseFormLevel, setCourseFormLevel] = useState<CourseLevel>("beginner");
  const [courseFormHours, setCourseFormHours] = useState(24);
  const [courseFormStatus, setCourseFormStatus] = useState<CourseStatus>("draft");

  // Modal Bài học
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonDuration, setLessonDuration] = useState(30);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>("published");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContent, setLessonContent] = useState("");

  // Modal Tài liệu / Video
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [matInputMode, setMatInputMode] = useState<"drive_link" | "file_upload">("drive_link");
  const [matExternalUrl, setMatExternalUrl] = useState("");
  const [matTitle, setMatTitle] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matType, setMatType] = useState<Material["fileType"]>("video");
  const [matSize, setMatSize] = useState("Google Drive");
  const [matFile, setMatFile] = useState<File | null>(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [activePreviewVideoId, setActivePreviewVideoId] = useState<string>("");

  const loadData = async () => {
    const [list, subs] = await Promise.all([
      courseDataService.getCourses("teacher", currentUser.id),
      courseDataService.getSubjects(true),
    ]);
    setCourses(list);
    setSubjects(subs);
    if (list.length > 0 && !selectedCourse) setSelectedCourse(list[0]);
  };

  useEffect(() => {
    void loadData().catch((err) => error("Không tải được dữ liệu khóa học", err instanceof Error ? err.message : "Vui lòng thử lại."));
  }, [currentUser.id]);

  useEffect(() => {
    if (!selectedCourse) return;
    let cancelled = false;
    Promise.all([
      courseDataService.getLessons(selectedCourse.id),
      courseDataService.getMaterials(selectedCourse.id),
      courseDataService.getEnrollments("teacher", currentUser.id, selectedCourse.id),
    ]).then(async ([courseLessons, courseMaterials, courseEnrollments]) => {
      const remoteIds = new Set(courseMaterials.map((material) => material.id));
      const legacyMaterials = storageService.getMaterials(selectedCourse.id).filter((material) =>
        isStoredCourseFile(material.fileUrl) && !remoteIds.has(material.id),
      );
      const migratedLegacyMaterials: Material[] = [];
      for (const material of legacyMaterials) {
        try {
          const fileUrl = await migrateLocalCourseFile(material.id, material.courseId, material.lessonId);
          if (!fileUrl) continue;
          migratedLegacyMaterials.push(await courseDataService.saveMaterial({ ...material, fileUrl }));
        } catch {
          // Chỉ bỏ qua bản cũ không còn tệp trong bộ nhớ máy này.
        }
      }

      const sharedMaterials = await Promise.all(courseMaterials.map(async (material) => {
        if (!isStoredCourseFile(material.fileUrl)) return material;
        try {
          const fileUrl = await migrateLocalCourseFile(material.id, material.courseId, material.lessonId);
          if (!fileUrl) return material;
          await courseDataService.saveMaterial({ ...material, fileUrl }, true);
          return { ...material, fileUrl };
        } catch {
          return material;
        }
      }));
      if (cancelled) return;
      setLessons(courseLessons);
      setMaterials([...migratedLegacyMaterials, ...sharedMaterials]);
      setSelectedFolderLessonId((currentId) =>
        currentId && courseLessons.some((lesson) => lesson.id === currentId)
          ? currentId
          : courseLessons[0]?.id || null,
      );
      setEnrollments(courseEnrollments);
    }).catch((err) => {
      if (!cancelled) error("Không tải được bài học hoặc danh sách học viên", err instanceof Error ? err.message : "Vui lòng thử lại.");
    });
    return () => { cancelled = true; };
  }, [selectedCourse, currentUser.id]);

  // Course Actions
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseFormTitle("");
    setCourseFormSubjectName("");
    setCourseFormDesc("");
    setCourseFormLevel("beginner");
    setCourseFormHours(24);
    setCourseFormStatus("draft");
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseFormTitle(course.title);
    setCourseFormSubjectName(getCourseSubjectName(course));
    setCourseFormDesc(course.description || "");
    setCourseFormLevel(course.level);
    setCourseFormHours(course.durationHours);
    setCourseFormStatus(course.status);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormTitle.trim()) {
      error("Lỗi", "Vui lòng nhập tên khóa học.");
      return;
    }

    const typedSubject = courseFormSubjectName.trim();
    const matchingSubject = subjects.find(
      (subject) => !subject.isHidden && subject.name.localeCompare(typedSubject, undefined, { sensitivity: "accent" }) === 0,
    );

    setIsSavingCourse(true);
    try {
      const saved = await courseDataService.saveCourse({
        id: editingCourse?.id,
        title: courseFormTitle.trim(),
        subjectId: matchingSubject?.id || (typedSubject ? getCustomSubjectId(typedSubject) : "subject-general"),
        subjectName: matchingSubject?.name || typedSubject || "Chưa phân môn",
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        description: courseFormDesc.trim(),
        level: courseFormLevel,
        durationHours: Number(courseFormHours),
        status: courseFormStatus,
        thumbnail: editingCourse?.thumbnail || "",
        tone: editingCourse?.tone || "lavender",
        badgeMark: editingCourse?.badgeMark || "EDU",
      });

      success(
        editingCourse ? "Đã cập nhật khóa học" : "Tạo khóa học thành công",
        editingCourse
          ? `Thông tin '${saved.title}' đã được cập nhật và đồng bộ.`
          : `Khóa học '${saved.title}' đã được lưu ở trạng thái ${saved.status.toUpperCase()}.`,
      );
      setIsCourseModalOpen(false);
      setEditingCourse(null);
      await loadData();
      setSelectedCourse(saved);
    } catch (err) {
      error("Không lưu được khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleChangeStatus = async (status: CourseStatus) => {
    if (!selectedCourse) return;
    try {
      const updated = await courseDataService.saveCourse({ ...selectedCourse, status });
      setSelectedCourse(updated);
      await loadData();
      success("Cập nhật trạng thái", `Khóa học đã chuyển sang trạng thái: ${status.toUpperCase()}`);
    } catch (err) {
      error("Không cập nhật được trạng thái", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa học '${selectedCourse.title}'? Hành động này không thể hoàn tác.`)) return;
    try {
      await courseDataService.deleteCourse(selectedCourse.id);
      success("Đã xóa khóa học", `Khóa học '${selectedCourse.title}' đã được gỡ khỏi hệ thống.`);
      const remaining = await courseDataService.getCourses("teacher", currentUser.id);
      setCourses(remaining);
      setSelectedCourse(remaining[0] || null);
    } catch (err) {
      error("Không xóa được khóa học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  // Lesson Actions
  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setLessonTitle(`Buổi ${lessons.length + 1}`);
    setLessonDesc("");
    setLessonDuration(30);
    setLessonStatus("published");
    setLessonVideoUrl("");
    setLessonContent("### Nội dung bài giảng\n\nNội dung chi tiết...");
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description);
    setLessonDuration(lesson.durationMinutes);
    setLessonStatus(lesson.status || "published");
    setLessonVideoUrl(lesson.videoUrl || "");
    setLessonContent(lesson.contentMarkdown);
    setIsLessonModalOpen(true);
  };

  const handleQuickChangeLessonStatus = async (lesson: Lesson, nextStatus: LessonStatus) => {
    if (!selectedCourse) return;
    try {
      await courseDataService.saveLesson({
        id: lesson.id,
        courseId: selectedCourse.id,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        status: nextStatus,
        videoUrl: lesson.videoUrl,
        contentMarkdown: lesson.contentMarkdown,
      });
      const refreshedLessons = await courseDataService.getLessons(selectedCourse.id);
      setLessons(refreshedLessons);
      success(
        "Đã cập nhật trạng thái buổi học",
        `${lesson.title}: ${nextStatus === "published" ? "Phát hành" : nextStatus === "draft" ? "Bản nháp" : "Bản ẩn"}`,
      );
    } catch (err) {
      error("Không cập nhật được trạng thái buổi học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle.trim()) return;

    try {
      const cleanVideoUrl = lessonVideoUrl.trim();
      const savedLesson = await courseDataService.saveLesson({
        id: editingLesson ? editingLesson.id : undefined,
        courseId: selectedCourse.id,
        title: lessonTitle.trim(),
        description: lessonDesc.trim(),
        durationMinutes: Number(lessonDuration),
        status: lessonStatus,
        videoUrl: cleanVideoUrl || undefined,
        contentMarkdown: lessonContent,
      });

      if (cleanVideoUrl) {
        const hasExistingVideoMaterial = materials.some(
          (m) => m.lessonId === savedLesson.id && m.fileUrl === cleanVideoUrl,
        );
        if (!hasExistingVideoMaterial && !isStoredCourseFile(cleanVideoUrl)) {
          const parsed = parseVideoSource(cleanVideoUrl);
          await courseDataService.saveMaterial({
            courseId: selectedCourse.id,
            lessonId: savedLesson.id,
            title: `Video bài giảng - ${savedLesson.title}`,
            description: parsed?.label || "Video bài giảng liên kết qua Google Drive / Web",
            fileType: "video",
            fileSize:
              parsed?.provider === "google-drive"
                ? "Google Drive"
                : parsed?.provider === "youtube"
                ? "YouTube"
                : "Link Video",
            fileUrl: cleanVideoUrl,
          });
        }
      }

      success(editingLesson ? "Đã sửa bài học" : "Đã thêm bài học mới");
      setIsLessonModalOpen(false);
      const [refreshedLessons, refreshedMaterials] = await Promise.all([
        courseDataService.getLessons(selectedCourse.id),
        courseDataService.getMaterials(selectedCourse.id),
      ]);
      setLessons(refreshedLessons);
      setMaterials(refreshedMaterials);
      setSelectedFolderLessonId(savedLesson.id);
      await loadData();
    } catch (err) {
      error("Không lưu được bài học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedCourse) return;
    if (confirm("Bạn có chắc chắn muốn xóa bài học này?")) {
      const lessonMaterials = materials.filter((material) => material.lessonId === lessonId);
      for (const material of lessonMaterials) {
        if (isStoredCourseFile(material.fileUrl)) {
          await deleteCourseFile(material.id).catch(() => undefined);
        }
        await courseDataService.deleteMaterial(material.id).catch(() => undefined);
      }
      try {
        await courseDataService.deleteLesson(lessonId);
        info("Đã xóa bài học");
        const [refreshedLessons, refreshedMaterials] = await Promise.all([
          courseDataService.getLessons(selectedCourse.id),
          courseDataService.getMaterials(selectedCourse.id),
        ]);
        setLessons(refreshedLessons);
        setMaterials(refreshedMaterials);
        if (selectedFolderLessonId === lessonId) setSelectedFolderLessonId(refreshedLessons[0]?.id || null);
        await loadData();
      } catch (err) {
        error("Không xóa được bài học", err instanceof Error ? err.message : "Vui lòng thử lại.");
      }
    }
  };

  const handleReorderLesson = async (lessonId: string, direction: "up" | "down") => {
    if (!selectedCourse) return;
    try {
      const reordered = await courseDataService.reorderLesson(selectedCourse.id, lessonId, direction);
      setLessons(reordered);
      info("Đã đổi thứ tự bài học");
    } catch (err) {
      error("Không đổi được thứ tự bài học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  // Material Actions
  const handleOpenCreateMaterial = (preferredMode: "drive_link" | "file_upload" = "drive_link") => {
    if (!selectedFolderLessonId) {
      info("Chọn buổi học trước", "Hãy mở một buổi học rồi thêm link video Drive hoặc tải tệp vào thư mục đó.");
      return;
    }
    const currentLes = lessons.find((l) => l.id === selectedFolderLessonId);
    setEditingMaterial(null);
    setMatInputMode(preferredMode);
    setMatExternalUrl("");
    setMatTitle(preferredMode === "drive_link" ? `Video bài giảng - ${currentLes?.title || "Buổi học"}` : "");
    setMatDesc("");
    setMatType(preferredMode === "drive_link" ? "video" : "pdf");
    setMatSize(preferredMode === "drive_link" ? "Google Drive" : "1.5 MB");
    setMatFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    const isExternalLink = !isStoredCourseFile(m.fileUrl) && /^https?:\/\//i.test(m.fileUrl);
    setMatInputMode(isExternalLink ? "drive_link" : "file_upload");
    setMatExternalUrl(isExternalLink ? m.fileUrl : "");
    setMatTitle(m.title);
    setMatDesc(m.description || "");
    setMatType(m.fileType);
    setMatSize(m.fileSize);
    setMatFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedFolderLessonId || !matTitle.trim()) return;

    if (matInputMode === "drive_link") {
      if (!matExternalUrl.trim()) {
        error("Chưa nhập đường dẫn Video", "Hãy dán link Google Drive, YouTube hoặc URL video bài giảng.");
        return;
      }
      setIsSavingMaterial(true);
      try {
        const cleanUrl = matExternalUrl.trim();
        const parsed = parseVideoSource(cleanUrl);
        const providerSizeLabel =
          parsed?.provider === "google-drive"
            ? "Google Drive"
            : parsed?.provider === "youtube"
            ? "YouTube"
            : parsed?.provider === "vimeo"
            ? "Vimeo"
            : "Link Video";
        const materialId = editingMaterial?.id || `mat-${crypto.randomUUID()}`;
        await courseDataService.saveMaterial(
          {
            id: materialId,
            courseId: selectedCourse.id,
            lessonId: selectedFolderLessonId,
            title: matTitle.trim(),
            description: matDesc.trim() || parsed?.label || "Video bài giảng trực tuyến",
            fileType: "video",
            fileSize: providerSizeLabel,
            fileUrl: cleanUrl,
          },
          Boolean(editingMaterial),
        );

        const lesson = lessons.find((item) => item.id === selectedFolderLessonId);
        success(
          editingMaterial ? "Đã cập nhật link video" : "Đã gắn link Video bài giảng",
          `Học viên đã có thể xem trực tiếp video (${providerSizeLabel}) ngay trên Web trong ${lesson?.title || "buổi học"}.`,
        );
        setIsMaterialModalOpen(false);
        setMatExternalUrl("");
        const [refreshedLessons, refreshedMaterials] = await Promise.all([
          courseDataService.getLessons(selectedCourse.id),
          courseDataService.getMaterials(selectedCourse.id),
        ]);
        setLessons(refreshedLessons);
        setMaterials(refreshedMaterials);
        setActivePreviewVideoId(materialId);
      } catch (err) {
        error("Không lưu được link video", err instanceof Error ? err.message : "Vui lòng thử lại.");
      } finally {
        setIsSavingMaterial(false);
      }
      return;
    }

    if (!editingMaterial && !matFile) {
      error("Chưa chọn tệp", "Hãy chọn video hoặc tài liệu từ máy tính để tải lên.");
      return;
    }

    setIsSavingMaterial(true);
    try {
      const materialId = editingMaterial?.id || `mat-${crypto.randomUUID()}`;
      const uploadedFileUrl = matFile
        ? await saveCourseFile(materialId, selectedCourse.id, selectedFolderLessonId, matFile)
        : undefined;
      const finalFileType = matFile ? getMaterialType(matFile) : matType;

      await courseDataService.saveMaterial(
        {
          id: materialId,
          courseId: selectedCourse.id,
          lessonId: selectedFolderLessonId,
          title: matTitle.trim(),
          description: matDesc.trim(),
          fileType: finalFileType,
          fileSize: matFile ? formatFileSize(matFile.size) : editingMaterial?.fileSize || matSize,
          fileUrl: uploadedFileUrl || editingMaterial?.fileUrl || `/materials/${materialId}`,
        },
        Boolean(editingMaterial),
      );

      const lesson = lessons.find((item) => item.id === selectedFolderLessonId);
      success(
        editingMaterial ? "Đã cập nhật tệp" : "Tải tệp lên thành công",
        `Tệp đã được lưu lên máy chủ và đồng bộ trong ${lesson?.title || "buổi học"}.`,
      );
      setIsMaterialModalOpen(false);
      setMatFile(null);
      const [refreshedLessons, refreshedMaterials] = await Promise.all([
        courseDataService.getLessons(selectedCourse.id),
        courseDataService.getMaterials(selectedCourse.id),
      ]);
      setLessons(refreshedLessons);
      setMaterials(refreshedMaterials);
      if (finalFileType === "video") {
        setActivePreviewVideoId(materialId);
      }
    } catch (uploadError) {
      error("Không tải được tệp", uploadError instanceof Error ? uploadError.message : "Vui lòng thử lại.");
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!selectedCourse) return;
    if (confirm("Xóa tài liệu này khỏi khóa học?")) {
      const material = materials.find((item) => item.id === matId);
      if (material && isStoredCourseFile(material.fileUrl)) {
        await deleteCourseFile(material.id).catch(() => undefined);
      }
      await courseDataService.deleteMaterial(matId);
      info("Đã xóa tài liệu");
      setMaterials(await courseDataService.getMaterials(selectedCourse.id));
    }
  };

  const getCourseSubjectName = (course: Course) => {
    const linkedSubject = subjects.find((subject) => subject.id === course.subjectId);
    if (linkedSubject) return linkedSubject.name;
    const legacyCodeMatch = subjects.find(
      (subject) => subject.code.toLowerCase() === (course.subjectName || "").toLowerCase(),
    );
    return legacyCodeMatch?.name || course.subjectName || "Chưa phân môn";
  };

  const suggestedSubjectNames = Array.from(new Set([
    ...subjects.filter((subject) => !subject.isHidden).map((subject) => subject.name),
    ...courses.map((course) => getCourseSubjectName(course)),
  ])).filter((name) => name && name !== "Chưa phân môn");

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedFolderLessonId) || null;
  const folderMaterials = selectedFolderLessonId
    ? materials.filter((material) => material.lessonId === selectedFolderLessonId)
    : [];
  const visibleFolderMaterials = folderMaterials.filter((material) =>
    `${material.title} ${material.description || ""} ${material.fileType}`.toLowerCase().includes(fileSearch.trim().toLowerCase()),
  );

  const folderVideoItems: VideoPlayableItem[] = React.useMemo(() => {
    if (!selectedLesson) return [];
    const items: VideoPlayableItem[] = folderMaterials
      .filter((m) => m.fileType === "video" || Boolean(parseVideoSource(m.fileUrl)?.isIframe))
      .map((m) => ({
        id: m.id,
        title: m.title,
        url: m.fileUrl,
        fileSize: m.fileSize,
        description: m.description,
      }));
    if (
      selectedLesson.videoUrl &&
      !items.some((item) => item.url === selectedLesson.videoUrl)
    ) {
      items.unshift({
        id: `lesson-video-${selectedLesson.id}`,
        title: `${selectedLesson.title} (Video chính)`,
        url: selectedLesson.videoUrl,
      });
    }
    return items;
  }, [selectedLesson, folderMaterials]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 3, 4, 5: KHÓA HỌC, BÀI HỌC & DANH SÁCH HỌC VIÊN (TEACHER)</span>
          <h2>Khóa học Giảng dạy & Quản lý Học viên</h2>
        </div>
        <button
          onClick={handleOpenCreateCourse}
          className="quick-action"
          style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
        >
          <span>+</span> Soạn khóa học mới
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Courses list */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "13px", color: "#1e293b" }}>Khóa học của bạn ({courses.length})</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {courses.map((c) => {
              const isSelected = selectedCourse?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: isSelected ? "#f5f3ff" : "#f8fafc",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{getCourseSubjectName(c)}</span>
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: "3px",
                        fontSize: "8.5px",
                        fontWeight: 700,
                        background:
                          c.status === "published"
                            ? "#ecfdf5"
                            : c.status === "draft"
                            ? "#fffbeb"
                            : c.status === "hidden"
                            ? "#fef2f2"
                            : "#f1f5f9",
                        color:
                          c.status === "published"
                            ? "#065f46"
                            : c.status === "draft"
                            ? "#b45309"
                            : c.status === "hidden"
                            ? "#dc2626"
                            : "#475569",
                      }}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#1e293b", margin: "4px 0" }}>
                    {c.title}
                  </strong>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {c.lessonCount} Bài học · {c.enrolledCount} Học viên ghi danh
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Course Tabs & Details */}
        {selectedCourse ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Course Summary Banner */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#6366f1" }}>
                    {getCourseSubjectName(selectedCourse)} · CẤP ĐỘ: {selectedCourse.level.toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 700,
                      background: selectedCourse.status === "published" ? "#ecfdf5" : "#fffbeb",
                      color: selectedCourse.status === "published" ? "#065f46" : "#b45309",
                    }}
                  >
                    TRẠNG THÁI: {selectedCourse.status.toUpperCase()}
                  </span>
                </div>
                <h2 style={{ margin: "4px 0", fontSize: "18px", color: "#1e293b" }}>{selectedCourse.title}</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{selectedCourse.description}</p>
              </div>

              {/* Sửa thông tin và chọn trạng thái khóa học */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditCourse(selectedCourse)}
                  style={{
                    padding: "7px 11px",
                    borderRadius: "6px",
                    border: "1px solid #c7d2fe",
                    background: "#eef2ff",
                    color: "#4338ca",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sửa thông tin
                </button>
                <select
                  value={selectedCourse.status}
                  onChange={(e) => handleChangeStatus(e.target.value as CourseStatus)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="published">Xuất bản (Published)</option>
                  <option value="hidden">Ẩn (Hidden)</option>
                  <option value="archived">Lưu trữ (Archived)</option>
                </select>
              </div>
            </div>

            {/* Course Tab Navigation */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "2px",
              }}
            >
              <button
                onClick={() => setActiveTab("lessons")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderBottom: activeTab === "lessons" ? "2px solid #4f46e5" : "2px solid transparent",
                  background: "none",
                  fontSize: "12px",
                  fontWeight: activeTab === "lessons" ? 700 : 500,
                  color: activeTab === "lessons" ? "#4f46e5" : "#64748b",
                  cursor: "pointer",
                }}
              >
                Bài học & Tài liệu ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab("roster")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderBottom: activeTab === "roster" ? "2px solid #4f46e5" : "2px solid transparent",
                  background: "none",
                  fontSize: "12px",
                  fontWeight: activeTab === "roster" ? 700 : 500,
                  color: activeTab === "roster" ? "#4f46e5" : "#64748b",
                  cursor: "pointer",
                }}
              >
                Danh sách học viên ({enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderBottom: activeTab === "settings" ? "2px solid #4f46e5" : "2px solid transparent",
                  background: "none",
                  fontSize: "12px",
                  fontWeight: activeTab === "settings" ? 700 : 500,
                  color: activeTab === "settings" ? "#4f46e5" : "#64748b",
                  cursor: "pointer",
                }}
              >
                Cài đặt & Xóa khóa học
              </button>
            </div>

            {/* TAB 1: COURSE DRIVE */}
            {activeTab === "lessons" && (
              <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                <div className="panel-heading" style={{ padding: "16px 18px", margin: 0, borderBottom: "1px solid #e2e8f0" }}>
                  <div>
                    <span className="eyebrow">THƯ VIỆN NỘI DUNG KHÓA HỌC</span>
                    <h2>Buổi học & video bài giảng</h2>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleOpenCreateLesson}
                      className="quick-action"
                      style={{ cursor: "pointer" }}
                    >
                      <Icon name="plus" size={13} /> Tạo buổi học
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateMaterial("drive_link")}
                      className="quick-action"
                      disabled={!selectedFolderLessonId}
                      style={{
                        cursor: selectedFolderLessonId ? "pointer" : "not-allowed",
                        background: "#0284c7",
                        color: "#fff",
                        borderColor: "#0284c7",
                        opacity: selectedFolderLessonId ? 1 : 0.55,
                      }}
                    >
                      ☁️ Dán link Video Drive / YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateMaterial("file_upload")}
                      className="quick-action"
                      disabled={!selectedFolderLessonId}
                      style={{ cursor: selectedFolderLessonId ? "pointer" : "not-allowed", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5", opacity: selectedFolderLessonId ? 1 : 0.55 }}
                    >
                      <Icon name="upload" size={13} /> Tải video / tệp từ máy
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", minHeight: "430px" }}>
                  <aside style={{ padding: "14px 10px", background: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>
                    <div style={{ padding: "4px 10px 10px", color: "#94a3b8", fontSize: "9px", fontWeight: 800, letterSpacing: "0.08em" }}>THƯ MỤC KHÓA HỌC</div>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderLessonId(null)}
                      style={{ width: "100%", padding: "9px 10px", display: "flex", alignItems: "center", gap: "9px", border: 0, borderRadius: "7px", background: selectedFolderLessonId ? "transparent" : "#e0e7ff", color: selectedFolderLessonId ? "#475569" : "#4338ca", fontWeight: 700, fontSize: "11px", textAlign: "left", cursor: "pointer" }}
                    >
                      <Icon name="folder" size={15} /> Tất cả buổi học
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                      {lessons.map((lesson, index) => {
                        const lessonFileCount = materials.filter((material) => material.lessonId === lesson.id).length;
                        const active = selectedFolderLessonId === lesson.id;
                        const lst = lesson.status || "published";
                        return (
                          <div key={lesson.id} style={{ display: "flex", alignItems: "center", borderRadius: "7px", background: active ? "#e0e7ff" : "transparent" }}>
                            <button
                              type="button"
                              onClick={() => { setSelectedFolderLessonId(lesson.id); setFileSearch(""); }}
                              style={{ minWidth: 0, flex: 1, padding: "9px 10px", display: "flex", alignItems: "center", gap: "6px", border: 0, background: "transparent", color: active ? "#4338ca" : "#475569", fontSize: "10.5px", fontWeight: active ? 700 : 600, textAlign: "left", cursor: "pointer" }}
                            >
                              <Icon name="folder" size={14} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title || `Buổi ${index + 1}`}</span>
                              <span
                                style={{
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  fontSize: "8.5px",
                                  fontWeight: 800,
                                  background: lst === "published" ? "#dcfce7" : lst === "draft" ? "#fef3c7" : "#f1f5f9",
                                  color: lst === "published" ? "#166534" : lst === "draft" ? "#b45309" : "#475569",
                                }}
                              >
                                {lst === "published" ? "PHÁT HÀNH" : lst === "draft" ? "NHÁP" : "ẨN"}
                              </span>
                              <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: "9px" }}>{lessonFileCount}</span>
                            </button>
                            <button type="button" disabled={index === 0} onClick={() => handleReorderLesson(lesson.id, "up")} title="Chuyển buổi lên" style={{ border: 0, background: "transparent", color: index === 0 ? "#cbd5e1" : "#64748b", padding: "4px", cursor: index === 0 ? "not-allowed" : "pointer" }}><Icon name="arrowUp" size={11} /></button>
                            <button type="button" disabled={index === lessons.length - 1} onClick={() => handleReorderLesson(lesson.id, "down")} title="Chuyển buổi xuống" style={{ border: 0, background: "transparent", color: index === lessons.length - 1 ? "#cbd5e1" : "#64748b", padding: "4px", cursor: index === lessons.length - 1 ? "not-allowed" : "pointer" }}><Icon name="arrowDown" size={11} /></button>
                            <button type="button" onClick={() => handleOpenEditLesson(lesson)} title="Sửa buổi học" style={{ border: 0, background: "transparent", color: "#64748b", padding: "4px", cursor: "pointer" }}><Icon name="edit" size={12} /></button>
                            <button type="button" onClick={() => handleDeleteLesson(lesson.id)} title="Xóa buổi học" style={{ border: 0, background: "transparent", color: "#ef4444", padding: "4px 8px 4px 4px", cursor: "pointer" }}><Icon name="trash" size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                    {lessons.length === 0 && (
                      <p style={{ margin: "10px", color: "#94a3b8", fontSize: "10px", lineHeight: 1.5 }}>Tạo Buổi 1 trước, sau đó thêm video bài giảng và tài liệu vào thư mục.</p>
                    )}
                  </aside>

                  <section style={{ minWidth: 0, padding: "16px 18px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "10px" }}>
                          <button type="button" onClick={() => setSelectedFolderLessonId(null)} style={{ border: 0, padding: 0, background: "transparent", color: "#64748b", cursor: "pointer" }}>Khóa học</button>
                          <Icon name="chevron" size={12} />
                          <strong style={{ color: "#334155" }}>{selectedLesson?.title || "Tất cả buổi học"}</strong>
                        </div>
                        <div style={{ marginTop: "5px", color: "#94a3b8", fontSize: "10px" }}>
                          {selectedLesson ? `${selectedLesson.durationMinutes} phút${selectedLesson.description ? ` · ${selectedLesson.description}` : ""}` : `${lessons.length} buổi học · ${materials.length} video và tài liệu`}
                        </div>
                      </div>
                      {selectedFolderLessonId && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {selectedLesson && (
                            <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "7px" }}>
                              {(
                                [
                                  ["published", "🟢 Phát hành"],
                                  ["draft", "🟡 Bản nháp"],
                                  ["hidden", "⚪ Bản ẩn"],
                                ] as [LessonStatus, string][]
                              ).map(([st, lbl]) => {
                                const isCurrent = (selectedLesson.status || "published") === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => void handleQuickChangeLessonStatus(selectedLesson, st)}
                                    style={{
                                      padding: "4px 8px",
                                      borderRadius: "5px",
                                      border: "none",
                                      background: isCurrent ? "#4f46e5" : "transparent",
                                      color: isCurrent ? "#fff" : "#475569",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {lbl}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ position: "relative", width: "min(200px, 100%)" }}>
                            <input value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} placeholder="Tìm video, tài liệu..." aria-label="Tìm trong buổi học" style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "7px", fontSize: "10.5px" }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {!selectedFolderLessonId ? (
                      lessons.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: "10px", paddingTop: "16px" }}>
                          {lessons.map((lesson, index) => {
                            const count = materials.filter((material) => material.lessonId === lesson.id).length;
                            return (
                              <button key={lesson.id} type="button" onClick={() => setSelectedFolderLessonId(lesson.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px", borderRadius: "9px", border: "1px solid #e2e8f0", background: "#fff", textAlign: "left", cursor: "pointer" }}>
                                <span style={{ width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "9px", background: "#eff6ff", color: "#3b82f6", flexShrink: 0 }}><Icon name="folder" size={20} /></span>
                                <span style={{ minWidth: 0 }}><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1e293b", fontSize: "11px" }}>{lesson.title || `Buổi ${index + 1}`}</strong><span style={{ color: "#94a3b8", fontSize: "9px" }}>{count} tệp · {lesson.durationMinutes} phút</span></span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: "62px 16px", textAlign: "center" }}>
                          <div style={{ display: "grid", placeItems: "center", width: "48px", height: "48px", margin: "0 auto 12px", borderRadius: "14px", background: "#eff6ff", color: "#3b82f6" }}><Icon name="folder" size={24} /></div>
                          <strong style={{ color: "#334155", fontSize: "12px" }}>Chưa có buổi học nào</strong>
                          <p style={{ margin: "6px auto 14px", maxWidth: "320px", color: "#94a3b8", fontSize: "10.5px", lineHeight: 1.5 }}>Tạo các buổi học như Buổi 1, Buổi 2. Mỗi buổi là một thư mục chứa video và tài liệu của buổi đó.</p>
                          <button type="button" onClick={handleOpenCreateLesson} className="quick-action" style={{ cursor: "pointer" }}><Icon name="plus" size={13} /> Tạo Buổi 1</button>
                        </div>
                      )
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "12px" }}>
                        {/* Inline Web Video Player for Teacher Preview (Supports Google Drive, YouTube & Server MP4) */}
                        {folderVideoItems.length > 0 && (
                          <CourseVideoPlayer
                            items={folderVideoItems}
                            activeItemId={activePreviewVideoId}
                            onSelectItem={(item) => setActivePreviewVideoId(item.id)}
                            isTeacherPreview
                          />
                        )}

                        {visibleFolderMaterials.length > 0 ? (
                          <div style={{ overflowX: "auto" }}>
                            <div style={{ minWidth: "560px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 115px 90px 115px", gap: "10px", padding: "8px 10px", color: "#94a3b8", fontSize: "9px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>
                                <span>Tên video / tài liệu</span>
                                <span>Nguồn / Loại</span>
                                <span>Ngày thêm</span>
                                <span>Thao tác</span>
                              </div>
                              {visibleFolderMaterials.map((material) => {
                                const parsedVid = parseVideoSource(material.fileUrl);
                                const isVideo = material.fileType === "video" || Boolean(parsedVid?.isIframe);
                                return (
                                  <div key={material.id} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 115px 90px 115px", gap: "10px", alignItems: "center", padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "10.5px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                                      <span style={{ display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "7px", background: isVideo ? "#fef2f2" : "#eff6ff", color: isVideo ? "#dc2626" : "#3b82f6", flexShrink: 0 }}>
                                        <Icon name={isVideo ? "play" : "fileText"} size={15} />
                                      </span>
                                      <span style={{ minWidth: 0 }}>
                                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#334155" }}>
                                          {material.title}
                                        </strong>
                                        <span style={{ display: "block", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8" }}>
                                          {material.description || (isVideo ? parsedVid?.label || "Video bài giảng" : "Tài liệu buổi học")}
                                        </span>
                                      </span>
                                    </div>
                                    <span style={{ color: "#475569", fontWeight: 700 }}>
                                      {parsedVid?.provider === "google-drive"
                                        ? "☁️ DRIVE VIDEO"
                                        : parsedVid?.provider === "youtube"
                                        ? "▶️ YOUTUBE"
                                        : `${material.fileType.toUpperCase()} (${material.fileSize})`}
                                    </span>
                                    <span style={{ color: "#94a3b8" }}>{new Date(material.uploadedAt).toLocaleDateString("vi-VN")}</span>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                                      {isVideo && (
                                        <button
                                          type="button"
                                          onClick={() => setActivePreviewVideoId(material.id)}
                                          style={{
                                            padding: "3px 7px",
                                            borderRadius: "5px",
                                            border: "1px solid #c7d2fe",
                                            background: "#eef2ff",
                                            color: "#4338ca",
                                            fontSize: "9.5px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                          }}
                                        >
                                          ▶️ Phát
                                        </button>
                                      )}
                                      <button type="button" onClick={() => handleOpenEditMaterial(material)} title="Sửa thông tin tệp / link" style={{ padding: "3px", border: 0, background: "transparent", color: "#4f46e5", cursor: "pointer" }}><Icon name="edit" size={12} /></button>
                                      <button type="button" onClick={() => handleDeleteMaterial(material.id)} title="Xóa tệp" style={{ padding: "3px", border: 0, background: "transparent", color: "#ef4444", cursor: "pointer" }}><Icon name="trash" size={12} /></button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: "42px 16px", textAlign: "center" }}>
                            <div style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", margin: "0 auto 10px", borderRadius: "13px", background: "#f1f5f9", color: "#64748b" }}><Icon name="upload" size={21} /></div>
                            <strong style={{ color: "#334155", fontSize: "11px" }}>Buổi học chưa có video hoặc tài liệu</strong>
                            <p style={{ margin: "5px 0 12px", color: "#94a3b8", fontSize: "10px" }}>Dán link video từ Google Drive / YouTube hoặc tải tệp video MP4, slide, bài tập vào thư mục này.</p>
                            <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                              <button type="button" onClick={() => handleOpenCreateMaterial("drive_link")} className="quick-action" style={{ cursor: "pointer", background: "#0284c7", color: "#fff", borderColor: "#0284c7" }}>☁️ Dán link Video Google Drive</button>
                              <button type="button" onClick={() => handleOpenCreateMaterial("file_upload")} className="quick-action" style={{ cursor: "pointer" }}><Icon name="upload" size={13} /> Tải tệp từ máy tính</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {/* TAB 2: STUDENT ROSTER (MODULE 5) */}
            {activeTab === "roster" && (
              <div className="panel">
                <div className="panel-heading" style={{ marginBottom: "14px" }}>
                  <div>
                    <span className="eyebrow">HỌC VIÊN ĐÃ GHI DANH VÀO KHÓA NÀY</span>
                    <h2>Danh sách Sinh viên & Tiến độ học tập</h2>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Tổng số: <strong>{enrollments.length}</strong> học viên
                  </span>
                </div>

                {enrollments.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                    Chưa có học viên nào ghi danh vào khóa học này.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Sinh viên</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Ngày ghi danh</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Tiến độ (%)</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Truy cập lần cuối</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enr) => (
                        <tr key={enr.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                }}
                              >
                                {enr.studentAvatar}
                              </div>
                              <div>
                                <strong style={{ color: "#1e293b", display: "block" }}>{enr.studentName}</strong>
                                <span style={{ fontSize: "10px", color: "#94a3b8" }}>{enr.studentEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>
                            {new Date(enr.enrolledAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "80px", height: "5px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                                <div
                                  style={{
                                    width: `${enr.progressPercent}%`,
                                    height: "100%",
                                    background: enr.progressPercent >= 80 ? "#06b6d4" : "#4f46e5",
                                    borderRadius: "10px",
                                  }}
                                />
                              </div>
                              <strong style={{ fontSize: "11px", color: "#4f46e5" }}>{enr.progressPercent}%</strong>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: "11px" }}>
                            {new Date(enr.lastAccessedAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "9.5px",
                                fontWeight: 700,
                                background: enr.status === "active" ? "#ecfdf5" : "#fee2e2",
                                color: enr.status === "active" ? "#065f46" : "#dc2626",
                              }}
                            >
                              {enr.status === "active" ? "ĐANG HỌC" : "ĐÃ HỦY"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 3: COURSE SETTINGS & DELETE */}
            {activeTab === "settings" && (
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">QUẢN LÝ KHÓA HỌC & TRẠNG THÁI</span>
                    <h2>Thiết lập trạng thái khóa học</h2>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                    Chuyển đổi trạng thái hiển thị:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {(["draft", "published", "hidden", "archived"] as CourseStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleChangeStatus(st)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: selectedCourse.status === st ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                          background: selectedCourse.status === st ? "#e0e7ff" : "#fff",
                          color: selectedCourse.status === st ? "#3730a3" : "#475569",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {st === "draft"
                          ? "Bản nháp"
                          : st === "published"
                          ? "Xuất bản"
                          : st === "hidden"
                          ? "Ẩn khóa học"
                          : "Lưu trữ"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danger zone: delete */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "12.5px", color: "#991b1b" }}>Xóa khóa học này</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b91c1c" }}>
                      Hành động này sẽ xóa toàn bộ bài học, tài liệu và dữ liệu ghi danh liên quan.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCourse}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Xóa khóa học
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Modal tạo mới hoặc chỉnh sửa thông tin khóa học */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => { setIsCourseModalOpen(false); setEditingCourse(null); }}
        title={editingCourse ? "Chỉnh sửa khóa học" : "Soạn thảo Khóa học Mới"}
        subtitle={editingCourse ? "Cập nhật thông tin sẽ được đồng bộ tới quản trị viên và học viên." : "Giảng viên tạo mới và chịu trách nhiệm nội dung đào tạo của khóa học."}
      >
        <form onSubmit={handleSaveCourse} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tên khóa học *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Cấp tốc lấy gốc Giải tích 1"
              value={courseFormTitle}
              onChange={(e) => setCourseFormTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
            <small style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "9.5px" }}>
              Tên chương trình hoặc lớp học; ví dụ: “Cấp tốc lấy gốc Giải tích 1”.
            </small>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label htmlFor="course-subject-name" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thuộc môn học
              </label>
              <input
                id="course-subject-name"
                type="text"
                list="course-subject-suggestions"
                value={courseFormSubjectName}
                onChange={(event) => setCourseFormSubjectName(event.target.value)}
                maxLength={120}
                placeholder="Vd: Giải tích 1"
                autoComplete="off"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              />
              <datalist id="course-subject-suggestions">
                {suggestedSubjectNames.map((name) => <option key={name} value={name} />)}
              </datalist>
              <small style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "9.5px" }}>Đây là ô nhập chữ: gõ môn mới rồi lưu, hoặc chọn gợi ý khi tên môn trùng các chữ bạn nhập. Không cần mã môn.</small>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Cấp độ
              </label>
              <select
                value={courseFormLevel}
                onChange={(e) => setCourseFormLevel(e.target.value as CourseLevel)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="beginner">Cơ bản (Beginner)</option>
                <option value="intermediate">Trung cấp (Intermediate)</option>
                <option value="advanced">Nâng cao (Advanced)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thời lượng ước tính (Giờ)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={courseFormHours}
                onChange={(e) => setCourseFormHours(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Trạng thái ban đầu
              </label>
              <select
                value={courseFormStatus}
                onChange={(e) => setCourseFormStatus(e.target.value as CourseStatus)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="draft">Bản nháp (Draft)</option>
                <option value="published">Xuất bản ngay (Published)</option>
                <option value="hidden">Ẩn khóa học</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Mô tả khóa học
            </label>
            <textarea
              rows={3}
              value={courseFormDesc}
              onChange={(e) => setCourseFormDesc(e.target.value)}
              placeholder="Giới thiệu mục tiêu, đối tượng và kiến thức đạt được. Video và tài liệu sẽ được sắp theo từng buổi học bên dưới."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => { setIsCourseModalOpen(false); setEditingCourse(null); }}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingCourse}
              style={{ padding: "8px 16px", borderRadius: "8px", background: isSavingCourse ? "#a5b4fc" : "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: isSavingCourse ? "wait" : "pointer" }}
            >
              {isSavingCourse ? "Đang lưu..." : editingCourse ? "Lưu thay đổi" : "Lưu khóa học"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Lesson */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={editingLesson ? "Sửa buổi học" : "Tạo buổi học mới"}
        subtitle="Mỗi buổi là một thư mục riêng để chứa video bài giảng và tài liệu."
      >
        <form onSubmit={handleSaveLesson} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tiêu đề bài học *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Buổi 1: Giới thiệu khóa học"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1.2fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thời lượng (phút)
              </label>
              <input
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Trạng thái buổi học
              </label>
              <select
                value={lessonStatus}
                onChange={(e) => setLessonStatus(e.target.value as LessonStatus)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="published">🟢 Phát hành (Published)</option>
                <option value="draft">🟡 Bản nháp (Draft)</option>
                <option value="hidden">⚪ Bản ẩn (Hidden)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Tóm tắt ngắn
              </label>
              <input
                type="text"
                placeholder="Khái niệm và ví dụ thực tế..."
                value={lessonDesc}
                onChange={(e) => setLessonDesc(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              ☁️ Link Video bài giảng chính (Google Drive / YouTube / URL — Không bắt buộc)
            </label>
            <input
              type="text"
              placeholder="Vd: https://drive.google.com/file/d/1aBcDeFg.../view?usp=sharing hoặc link YouTube"
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
            <small style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "10px" }}>
              Thầy/cô có thể dán trực tiếp link chia sẻ video trên Google Drive vào đây để học viên xem ngay trên Web.
            </small>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Nội dung bài giảng (Markdown)
            </label>
            <textarea
              rows={6}
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Lưu bài học
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Material (Supports both Method 2: Google Drive/YouTube Link & Method 1: File Upload) */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title={editingMaterial ? "Chỉnh sửa Video / Tài liệu" : "Thêm Video bài giảng hoặc Tài liệu"}
        subtitle={`${selectedLesson?.title || "Buổi học"} · Hỗ trợ dẫn link Video từ Google Drive / YouTube hoặc tải tệp trực tiếp lên máy chủ`}
      >
        <form onSubmit={handleSaveMaterial} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "4px", background: "#f1f5f9", borderRadius: "9px" }}>
            <button
              type="button"
              onClick={() => {
                setMatInputMode("drive_link");
                setMatType("video");
                if (!matTitle.trim() && selectedLesson) {
                  setMatTitle(`Video bài giảng - ${selectedLesson.title}`);
                }
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "7px",
                border: "none",
                background: matInputMode === "drive_link" ? "#0284c7" : "transparent",
                color: matInputMode === "drive_link" ? "#ffffff" : "#475569",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ☁️ Dán link Google Drive / YouTube
            </button>
            <button
              type="button"
              onClick={() => setMatInputMode("file_upload")}
              style={{
                padding: "8px 10px",
                borderRadius: "7px",
                border: "none",
                background: matInputMode === "file_upload" ? "#4f46e5" : "transparent",
                color: matInputMode === "file_upload" ? "#ffffff" : "#475569",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📤 Tải tệp / Video từ máy tính
            </button>
          </div>

          {matInputMode === "drive_link" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#0369a1", marginBottom: "4px" }}>
                  Đường dẫn (Link) Video trên Google Drive / YouTube *
                </label>
                <input
                  type="url"
                  required
                  placeholder="Vd: https://drive.google.com/file/d/1aBcDeFgHiJkLmN.../view?usp=sharing"
                  value={matExternalUrl}
                  onChange={(e) => setMatExternalUrl(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #38bdf8", fontSize: "12px", background: "#f0f9ff" }}
                />
                {matExternalUrl.trim() && (
                  <div style={{ marginTop: "6px", fontSize: "10.5px", color: "#0369a1", fontWeight: 700 }}>
                    {(() => {
                      const detected = parseVideoSource(matExternalUrl);
                      if (!detected) return "⚠️ Đường dẫn chưa đúng định dạng URL.";
                      if (detected.provider === "google-drive") {
                        return `✓ Đã nhận diện Google Drive Video (Mã tệp: ${detected.fileId}) — Hệ thống tự động nhúng trình phát chuẩn /preview.`;
                      }
                      if (detected.provider === "youtube") {
                        return `✓ Đã nhận diện YouTube Video (ID: ${detected.fileId}) — Hệ thống tự động nhúng trình phát.`;
                      }
                      return `✓ Đã nhận diện: ${detected.label}`;
                    })()}
                  </div>
                )}
              </div>

              <div style={{ padding: "9px 11px", borderRadius: "7px", background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: "10.5px", lineHeight: 1.5 }}>
                💡 <strong>Lưu ý khi dùng Google Drive:</strong> Trên Google Drive, thầy/cô bấm chuột phải vào video → <strong>Chia sẻ (Share)</strong> → chọn <strong>&quot;Bất kỳ ai có đường liên kết đều có thể xem (Anyone with the link → Viewer)&quot;</strong> rồi sao chép đường liên kết dán vào ô trên.
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="course-material-file" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Chọn tệp {editingMaterial && isStoredCourseFile(editingMaterial.fileUrl) ? "mới (nếu muốn thay thế)" : "*"} (Tối đa 500 MB)
              </label>
              <input
                id="course-material-file"
                type="file"
                required={!editingMaterial || !isStoredCourseFile(editingMaterial.fileUrl)}
                accept="video/*,.pdf,.ppt,.pptx,.key,.doc,.docx,.rtf,.zip,.rar,.7z,.py,.js,.ts,.tsx,.cpp,.c,.java,.html,.css"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setMatFile(file);
                  if (file) {
                    setMatTitle(file.name.replace(/\.[^.]+$/, ""));
                    setMatType(getMaterialType(file));
                    setMatSize(formatFileSize(file.size));
                  }
                }}
                style={{ width: "100%", padding: "9px", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", fontSize: "11px" }}
              />
              {!matFile && editingMaterial && <small style={{ display: "block", marginTop: "5px", color: "#64748b", fontSize: "10px" }}>Tệp hiện tại: {editingMaterial.title} · {editingMaterial.fileSize}</small>}
              {matFile && <small style={{ display: "block", marginTop: "5px", color: "#64748b", fontSize: "10px" }}>Định dạng: {matType.toUpperCase()} · Dung lượng: {matSize}</small>}
            </div>
          )}

          <div>
            <label htmlFor="course-material-title" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tên hiển thị *
            </label>
            <input
              id="course-material-title"
              type="text"
              required
              placeholder="Vd: Video Buổi 1 - Giới thiệu"
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Mô tả / Ghi chú
            </label>
            <input
              type="text"
              placeholder="Vd: Video bài giảng quay màn hình & hướng dẫn thực hành"
              value={matDesc}
              onChange={(e) => setMatDesc(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsMaterialModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: matInputMode === "drive_link" ? "#0284c7" : "#4f46e5",
                color: "#fff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSavingMaterial
                ? "Đang lưu..."
                : editingMaterial
                ? "Lưu thay đổi"
                : matInputMode === "drive_link"
                ? "☁️ Lưu link Video"
                : "📤 Tải tệp lên"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
