// ============================================================================
// EDUMIND AI - TEACHER COURSE & LESSON & ROSTER MANAGER (MODULE 3, 4, 5)
// Giảng viên quản lý khóa học, bài học, tài liệu & danh sách học viên ghi danh
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Course, Lesson, Material, Enrollment, CourseStatus, CourseLevel } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function TeacherCourses() {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"lessons" | "roster" | "settings">("lessons");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Modal Tạo Khóa học
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseFormTitle, setCourseFormTitle] = useState("");
  const [courseFormSubjectId, setCourseFormSubjectId] = useState("sub-01");
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
  const [lessonContent, setLessonContent] = useState("");

  // Modal Tài liệu
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [matTitle, setMatTitle] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matType, setMatType] = useState<Material["fileType"]>("pdf");
  const [matSize, setMatSize] = useState("1.5 MB");

  const loadData = () => {
    const list = storageService.getCourses("teacher", currentUser.id);
    setCourses(list);
    if (list.length > 0 && !selectedCourse) {
      setSelectedCourse(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedCourse) {
      setLessons(storageService.getLessons(selectedCourse.id));
      setMaterials(storageService.getMaterials(selectedCourse.id));
      setEnrollments(storageService.getEnrollments(undefined, selectedCourse.id));
    }
  }, [selectedCourse]);

  // Course Actions
  const handleOpenCreateCourse = () => {
    setCourseFormTitle("");
    setCourseFormSubjectId("sub-01");
    setCourseFormDesc("");
    setCourseFormLevel("beginner");
    setCourseFormHours(24);
    setCourseFormStatus("draft");
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormTitle.trim()) {
      error("Lỗi", "Vui lòng nhập tên khóa học.");
      return;
    }

    const subjects = storageService.getSubjects(true);
    const sub = subjects.find((s) => s.id === courseFormSubjectId);

    const saved = storageService.saveCourse({
      id: undefined,
      title: courseFormTitle.trim(),
      subjectId: courseFormSubjectId,
      subjectName: sub ? sub.code : "CS101",
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      description: courseFormDesc.trim(),
      level: courseFormLevel,
      durationHours: Number(courseFormHours),
      status: courseFormStatus,
      tone: "lavender",
      badgeMark: "EDU",
    });

    success("Tạo khóa học thành công", `Khóa học '${saved.title}' đã được lưu ở trạng thái ${saved.status.toUpperCase()}.`);
    setIsCourseModalOpen(false);
    loadData();
    setSelectedCourse(saved);
  };

  const handleChangeStatus = (status: CourseStatus) => {
    if (!selectedCourse) return;
    const updated = storageService.saveCourse({
      ...selectedCourse,
      status,
    });
    setSelectedCourse(updated);
    loadData();
    success("Cập nhật trạng thái", `Khóa học đã chuyển sang trạng thái: ${status.toUpperCase()}`);
  };

  const handleDeleteCourse = () => {
    if (!selectedCourse) return;
    if (confirm(`Bạn có chắc chắn muốn xóa khóa học '${selectedCourse.title}'? Hành động này không thể hoàn tác.`)) {
      storageService.deleteCourse(selectedCourse.id);
      success("Đã xóa khóa học", `Khóa học '${selectedCourse.title}' đã được gỡ khỏi hệ thống.`);
      const remaining = storageService.getCourses("teacher", currentUser.id);
      setCourses(remaining);
      setSelectedCourse(remaining[0] || null);
    }
  };

  // Lesson Actions
  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setLessonTitle("");
    setLessonDesc("");
    setLessonDuration(30);
    setLessonContent("### Nội dung bài giảng\n\nNội dung chi tiết...");
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description);
    setLessonDuration(lesson.durationMinutes);
    setLessonContent(lesson.contentMarkdown);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle.trim()) return;

    storageService.saveLesson({
      id: editingLesson ? editingLesson.id : undefined,
      courseId: selectedCourse.id,
      title: lessonTitle.trim(),
      description: lessonDesc.trim(),
      durationMinutes: Number(lessonDuration),
      contentMarkdown: lessonContent,
    });

    success(editingLesson ? "Đã sửa bài học" : "Đã thêm bài học mới");
    setIsLessonModalOpen(false);
    setLessons(storageService.getLessons(selectedCourse.id));
    loadData();
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!selectedCourse) return;
    if (confirm("Bạn có chắc chắn muốn xóa bài học này?")) {
      storageService.deleteLesson(lessonId);
      info("Đã xóa bài học");
      setLessons(storageService.getLessons(selectedCourse.id));
      loadData();
    }
  };

  const handleReorderLesson = (lessonId: string, direction: "up" | "down") => {
    if (!selectedCourse) return;
    const ok = storageService.reorderLesson(selectedCourse.id, lessonId, direction);
    if (ok) {
      setLessons(storageService.getLessons(selectedCourse.id));
      info("Đã đổi thứ tự bài học");
    }
  };

  // Material Actions
  const handleOpenCreateMaterial = () => {
    setEditingMaterial(null);
    setMatTitle("");
    setMatDesc("");
    setMatType("pdf");
    setMatSize("1.5 MB");
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    setMatTitle(m.title);
    setMatDesc(m.description || "");
    setMatType(m.fileType);
    setMatSize(m.fileSize);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !matTitle.trim()) return;

    storageService.saveMaterial({
      id: editingMaterial ? editingMaterial.id : undefined,
      courseId: selectedCourse.id,
      lessonId: lessons[0]?.id || "les-01",
      title: matTitle.trim(),
      description: matDesc.trim(),
      fileType: matType,
      fileSize: matSize,
      fileUrl: `/materials/${matTitle.toLowerCase().replace(/\s+/g, "-")}.${matType}`,
    });

    success(
      editingMaterial ? "Đã sửa thông tin tài liệu" : "Tải lên tài liệu thành công",
      `Tài liệu '${matTitle}' đã được lưu vào hệ thống.`
    );
    setIsMaterialModalOpen(false);
    setMaterials(storageService.getMaterials(selectedCourse.id));
  };

  const handleDeleteMaterial = (matId: string) => {
    if (!selectedCourse) return;
    if (confirm("Xóa tài liệu này khỏi khóa học?")) {
      storageService.deleteMaterial(matId);
      info("Đã xóa tài liệu");
      setMaterials(storageService.getMaterials(selectedCourse.id));
    }
  };

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
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{c.subjectName}</span>
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
                    {selectedCourse.subjectName} · CẤP ĐỘ: {selectedCourse.level.toUpperCase()}
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

              {/* Status Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

            {/* TAB 1: LESSONS & MATERIALS */}
            {activeTab === "lessons" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Lessons Section */}
                <div className="panel">
                  <div className="panel-heading" style={{ marginBottom: "14px" }}>
                    <div>
                      <span className="eyebrow">DANH SÁCH BÀI GIẢNG ({lessons.length})</span>
                      <h2>Cấu trúc bài giảng & Thứ tự</h2>
                    </div>
                    <button
                      onClick={handleOpenCreateLesson}
                      className="quick-action"
                      style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
                    >
                      <span>+</span> Thêm bài học mới
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {lessons.map((les, index) => (
                      <div
                        key={les.id}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              fontSize: "11px",
                              fontWeight: 800,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>{les.title}</strong>
                            <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                              ⏱️ {les.durationMinutes} phút · {les.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleReorderLesson(les.id, "up")}
                            title={index === 0 ? "Đã ở vị trí đầu" : "Chuyển lên trên"}
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0",
                              background: index === 0 ? "#f8fafc" : "#fff",
                              color: index === 0 ? "#cbd5e1" : "#475569",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            <Icon name="arrowUp" size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={index === lessons.length - 1}
                            onClick={() => handleReorderLesson(les.id, "down")}
                            title={index === lessons.length - 1 ? "Đã ở vị trí cuối" : "Chuyển xuống dưới"}
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0",
                              background: index === lessons.length - 1 ? "#f8fafc" : "#fff",
                              color: index === lessons.length - 1 ? "#cbd5e1" : "#475569",
                              cursor: index === lessons.length - 1 ? "not-allowed" : "pointer",
                            }}
                          >
                            <Icon name="arrowDown" size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEditLesson(les)}
                            title="Chỉnh sửa bài học"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              color: "#4f46e5",
                              cursor: "pointer",
                            }}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(les.id)}
                            title="Xóa bài học"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #fee2e2",
                              background: "#fef2f2",
                              color: "#dc2626",
                              cursor: "pointer",
                            }}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Section */}
                <div className="panel">
                  <div className="panel-heading" style={{ marginBottom: "14px" }}>
                    <div>
                      <span className="eyebrow">TÀI LIỆU KHÓA HỌC ({materials.length})</span>
                      <h2>Slide, Mã nguồn & Tài liệu tham khảo</h2>
                    </div>
                    <button
                      onClick={handleOpenCreateMaterial}
                      className="quick-action"
                      style={{ cursor: "pointer", background: "#f8fafc" }}
                    >
                      <Icon name="upload" size={13} /> Tải lên tài liệu
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                    {materials.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <span style={{ color: "#6366f1", flexShrink: 0 }}><Icon name="fileText" size={16} /></span>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: "11.5px", color: "#1e293b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</strong>
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>{m.fileType.toUpperCase()} · {m.fileSize}{m.description ? ` · ${m.description}` : ""}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                          <button
                            onClick={() => handleOpenEditMaterial(m)}
                            title="Sửa tên / mô tả tài liệu"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", padding: "4px" }}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            title="Xóa tài liệu"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                                    background: enr.progressPercent >= 80 ? "#10b981" : "#4f46e5",
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

      {/* Modal Add Course */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Soạn thảo Khóa học Mới"
        subtitle="Giảng viên tạo mới và chịu trách nhiệm nội dung đào tạo của khóa học."
      >
        <form onSubmit={handleSaveCourse} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tên khóa học *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Lập trình Python từ cơ bản đến ứng dụng"
              value={courseFormTitle}
              onChange={(e) => setCourseFormTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thuộc Môn học
              </label>
              <select
                value={courseFormSubjectId}
                onChange={(e) => setCourseFormSubjectId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                {storageService.getSubjects(true).map((s) => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
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
              placeholder="Giới thiệu mục tiêu khóa học..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Lưu khóa học
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Lesson */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={editingLesson ? "Sửa Bài Học" : "Thêm Bài Học Mới"}
        subtitle="Soạn thảo tiêu đề, thời lượng và nội dung bài giảng Markdown."
      >
        <form onSubmit={handleSaveLesson} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tiêu đề bài học *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Bài 4: Vòng lặp For & Hàm range()"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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

      {/* Modal Add / Edit Material */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title={editingMaterial ? "Chỉnh sửa Tài liệu" : "Tải lên Tài liệu Mới"}
        subtitle={editingMaterial ? "Cập nhật tên, mô tả hoặc phân loại tài liệu đính kèm." : "Hỗ trợ Slide bài giảng, file code mẫu, PDF hoặc tài liệu tham khảo."}
      >
        <form onSubmit={handleSaveMaterial} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tên tài liệu *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Slide bài giảng: Vòng lặp For"
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Mô tả / Ghi chú tài liệu
            </label>
            <input
              type="text"
              placeholder="Vd: Tóm tắt cú pháp và các bài tập mẫu kèm lời giải"
              value={matDesc}
              onChange={(e) => setMatDesc(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Định dạng tệp
              </label>
              <select
                value={matType}
                onChange={(e) => setMatType(e.target.value as any)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="pdf">Tệp tài liệu PDF</option>
                <option value="slide">Slide trình chiếu (PPTX/PDF)</option>
                <option value="code">Mã nguồn (Python/C++/JS)</option>
                <option value="docx">Văn bản Word</option>
                <option value="zip">Tệp nén (ZIP/RAR)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Dung lượng tệp
              </label>
              <input
                type="text"
                value={matSize}
                onChange={(e) => setMatSize(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
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
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              {editingMaterial ? "Cập nhật tài liệu" : "Lưu tài liệu"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
