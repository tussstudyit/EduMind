// ============================================================================
// EDUMIND AI - STUDENT COURSE CATALOG & ENROLLMENT (MODULE 3 & 5)
// Khám phá khóa học, xem chi tiết đề cương, tham gia & quản lý "Khóa học của tôi"
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Course, Enrollment, Subject, Lesson, Material } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

interface CourseCatalogProps {
  onLearnCourse: (courseId: string) => void;
}

export function CourseCatalog({ onLearnCourse }: CourseCatalogProps) {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Main Tabs: Explore all vs My Enrolled
  const [viewTab, setViewTab] = useState<"all" | "my">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Course Detail Modal
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailLessons, setDetailLessons] = useState<Lesson[]>([]);
  const [detailMaterials, setDetailMaterials] = useState<Material[]>([]);

  const loadData = () => {
    // Chỉ lấy khóa học đã xuất bản (published)
    const pubCourses = storageService.getCourses("student");
    // Chỉ lấy môn học không bị ẩn
    const pubSubjects = storageService.getSubjects(false);
    const validSubjectIds = new Set(pubSubjects.map((s) => s.id));

    // Lọc khóa học thuộc môn học hợp lệ
    const visibleCourses = pubCourses.filter((c) => validSubjectIds.has(c.subjectId));
    setCourses(visibleCourses);
    setSubjects(pubSubjects);

    const myEnr = storageService.getEnrollments(currentUser.id);
    setEnrollments(myEnr);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleOpenDetail = (course: Course) => {
    setDetailCourse(course);
    setDetailLessons(storageService.getLessons(course.id));
    setDetailMaterials(storageService.getMaterials(course.id));
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.courseId === courseId && e.status === "active");
  };

  const handleEnroll = (course: Course) => {
    storageService.enrollCourse(course.id, currentUser);
    success("Ghi danh thành công!", `Bạn đã đăng ký tham gia '${course.title}'.`);
    loadData();
  };

  const handleDrop = (course: Course) => {
    if (confirm(`Bạn có chắc chắn muốn hủy tham gia khóa học '${course.title}'?`)) {
      storageService.dropCourse(course.id, currentUser.id);
      info("Đã hủy ghi danh", `Bạn đã rút khỏi khóa học '${course.title}'.`);
      loadData();
      if (detailCourse?.id === course.id) {
        setDetailCourse(null);
      }
    }
  };

  // Filter logic
  let displayCourses = courses;
  if (viewTab === "my") {
    const enrolledCourseIds = new Set(
      enrollments.filter((e) => e.status === "active").map((e) => e.courseId)
    );
    displayCourses = courses.filter((c) => enrolledCourseIds.has(c.id));
  }

  const filteredCourses = displayCourses.filter((c) => {
    const matchSub = selectedSubject === "all" || c.subjectId === selectedSubject;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  const enrolledCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 3 & 5: DANH MỤC KHÓA HỌC & GHI DANH (STUDENT)</span>
          <h2>Khám phá & Khóa học của Tôi</h2>
        </div>
      </div>

      {/* Primary Tabs: Explore vs My Courses */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          gap: "10px",
        }}
      >
        <button
          onClick={() => setViewTab("all")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: viewTab === "all" ? "2.5px solid #4f46e5" : "2.5px solid transparent",
            background: "none",
            fontSize: "13px",
            fontWeight: viewTab === "all" ? 750 : 550,
            color: viewTab === "all" ? "#4f46e5" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="search" size={15} />
          Khám phá tất cả ({courses.length})
        </button>

        <button
          onClick={() => setViewTab("my")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: viewTab === "my" ? "2.5px solid #4f46e5" : "2.5px solid transparent",
            background: "none",
            fontSize: "13px",
            fontWeight: viewTab === "my" ? 750 : 550,
            color: viewTab === "my" ? "#4f46e5" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="book" size={15} />
          Khóa học của tôi ({enrolledCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          padding: "14px 18px",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "380px" }}>
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên khóa học, giảng viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "12px", background: "transparent" }}
          />
        </div>

        {/* Subjects Filter */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setSelectedSubject("all")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedSubject === "all" ? "1px solid #4f46e5" : "1px solid #e2e8f0",
              background: selectedSubject === "all" ? "#e0e7ff" : "#f8fafc",
              color: selectedSubject === "all" ? "#3730a3" : "#64748b",
            }}
          >
            Tất cả
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: selectedSubject === sub.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                background: selectedSubject === sub.id ? "#e0e7ff" : "#f8fafc",
                color: selectedSubject === sub.id ? "#3730a3" : "#64748b",
              }}
            >
              {sub.code}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Courses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filteredCourses.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            {viewTab === "my"
              ? "Bạn chưa ghi danh khóa học nào. Hãy chuyển sang tab 'Khám phá tất cả' để chọn khóa học!"
              : "Không tìm thấy khóa học nào phù hợp với bộ lọc."}
          </div>
        ) : (
          filteredCourses.map((c) => {
            const enrolled = isEnrolled(c.id);
            const enrData = enrollments.find((e) => e.courseId === c.id && e.status === "active");

            return (
              <div
                key={c.id}
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s ease",
                }}
              >
                {/* Visual Banner */}
                <div
                  className={`course-visual ${c.tone}`}
                  style={{ height: "95px", cursor: "pointer" }}
                  onClick={() => handleOpenDetail(c)}
                >
                  <span className="course-subject">{c.subjectName}</span>
                  <span className="course-mark">{c.badgeMark}</span>
                  <div className="course-visual-orb" />
                </div>

                {/* Content Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Giảng viên: {c.teacherName}</div>
                    <h3
                      onClick={() => handleOpenDetail(c)}
                      style={{ margin: "4px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b", cursor: "pointer" }}
                    >
                      {c.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b", lineHeight: "1.4" }}>
                      {c.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#94a3b8",
                      paddingTop: "6px",
                    }}
                  >
                    <span>⏱️ {c.durationHours} giờ</span>
                    <span>📚 {c.lessonCount} bài học</span>
                    <span>👥 {c.enrolledCount} học viên</span>
                  </div>

                  {/* Progress bar if enrolled */}
                  {enrolled && enrData && (
                    <div style={{ marginTop: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#4f46e5", fontWeight: 700, marginBottom: "3px" }}>
                        <span>Tiến độ học tập</span>
                        <span>{enrData.progressPercent}%</span>
                      </div>
                      <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${enrData.progressPercent}%`,
                            height: "100%",
                            background: "#4f46e5",
                            borderRadius: "10px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ marginTop: "auto", paddingTop: "10px", display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenDetail(c)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Chi tiết
                    </button>

                    {enrolled ? (
                      <>
                        <button
                          onClick={() => onLearnCourse(c.id)}
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            borderRadius: "8px",
                            background: "#4f46e5",
                            color: "#fff",
                            border: "none",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Vào học ngay
                        </button>
                        <button
                          onClick={() => handleDrop(c)}
                          title="Hủy tham gia khóa học"
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "8px",
                          background: "#059669",
                          color: "#fff",
                          border: "none",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        + Tham gia khóa học
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Course Detail Modal */}
      <Modal
        isOpen={!!detailCourse}
        onClose={() => setDetailCourse(null)}
        title={detailCourse?.title || "Chi tiết Khóa học"}
        subtitle={`Giảng viên: ${detailCourse?.teacherName} · Môn học: ${detailCourse?.subjectName} · Cấp độ: ${detailCourse?.level.toUpperCase()}`}
        maxWidth="680px"
      >
        {detailCourse && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Overview info */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
                lineHeight: "1.5",
              }}
            >
              {detailCourse.description}
            </div>

            {/* Syllabus outline */}
            <div>
              <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                Đề cương bài giảng ({detailLessons.length} bài học):
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {detailLessons.map((les, index) => (
                  <div
                    key={les.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>#{index + 1}</span>
                      <strong style={{ color: "#1e293b" }}>{les.title}</strong>
                    </div>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>⏱️ {les.durationMinutes} phút</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Preview */}
            {detailMaterials.length > 0 && (
              <div>
                <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                  Tài liệu đính kèm ({detailMaterials.length}):
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {detailMaterials.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#334155",
                      }}
                    >
                      <Icon name="fileText" size={13} className="text-indigo-600" />
                      <span>{m.title}</span>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>({m.fileSize})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #e2e8f0",
                marginTop: "6px",
              }}
            >
              <button
                type="button"
                onClick={() => setDetailCourse(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                {isEnrolled(detailCourse.id) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDrop(detailCourse)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        fontSize: "12px",
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Hủy tham gia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailCourse(null);
                        onLearnCourse(detailCourse.id);
                      }}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        background: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Vào phòng học ngay
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleEnroll(detailCourse);
                    }}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "8px",
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Tham gia khóa học ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
