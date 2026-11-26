// ============================================================================
// EDUMIND AI - STUDENT STUDOCU DISCOVERY, COURSE CATALOG & N8N INTERACTION HUB
// Giao diện chính cho Sinh viên (không dùng Dashboard cũ): Tìm kiếm & Gợi ý kiểu
// Studocu, Xếp hạng Giảng viên (Trung bình Sao lớn n8n), Ghi danh, Đánh giá Sao
// Giảng viên qua n8n & Báo cáo vi phạm khóa học gửi Admin qua n8n.
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Course,
  Enrollment,
  Subject,
  Lesson,
  Material,
  TeacherReview,
  TeacherReviewSummary,
  User,
} from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

interface CourseCatalogProps {
  onLearnCourse: (courseId: string) => void;
  onOpenView?: (viewId: string) => void;
  onAskAITutor?: (prompt: string) => void;
}

export function CourseCatalog({ onLearnCourse, onOpenView, onAskAITutor }: CourseCatalogProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { success, info, error, warning } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [allReviews, setAllReviews] = useState<TeacherReview[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Main Tabs: Explore all vs My Enrolled
  const [viewTab, setViewTab] = useState<"all" | "my">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Course Detail Modal
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailLessons, setDetailLessons] = useState<Lesson[]>([]);
  const [detailMaterials, setDetailMaterials] = useState<Material[]>([]);

  // Teacher Profile & n8n Star Rating Modal
  const [teacherProfileCourse, setTeacherProfileCourse] = useState<Course | null>(null);
  const [teacherModalReviews, setTeacherModalReviews] = useState<TeacherReview[]>([]);
  const [teacherModalSummary, setTeacherModalSummary] = useState<TeacherReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    badge: "Chưa có đánh giá",
  });
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Course Violation Report Modal (SV -> n8n -> Admin)
  const [reportingCourse, setReportingCourse] = useState<Course | null>(null);
  const [reportReason, setReportReason] = useState("Nội dung bài giảng/video vi phạm hoặc không truy cập được");
  const [reportDesc, setReportDesc] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pubCourses, pubSubjects, teacherList, myEnr, reviewRes] = await Promise.all([
        apiClient.getCourses(),
        apiClient.getSubjects(false).catch(() => []),
        apiClient.getTeacherDirectory().catch(() => []),
        isAuthenticated ? apiClient.getEnrollments().catch(() => []) : Promise.resolve([]),
        apiClient.getTeacherReviews().catch(() => ({ reviews: [], summary: null })),
      ]);

      setCourses(pubCourses.filter((c) => c.status === "published"));
      setSubjects(pubSubjects.filter((s) => !s.isHidden));
      setTeachers(teacherList);
      setEnrollments(myEnr);
      setAllReviews(reviewRes.reviews || []);
    } catch (err) {
      error("Không tải được danh sách lớp học", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentUser.id, isAuthenticated]);

  const handleOpenDetail = async (course: Course) => {
    setDetailCourse(course);
    setDetailLessons([]);
    setDetailMaterials([]);
    try {
      const [les, mats] = await Promise.all([
        apiClient.getLessons(course.id).catch(() => []),
        apiClient.getMaterials(course.id).catch(() => []),
      ]);
      setDetailLessons(les);
      setDetailMaterials(mats);
    } catch {
      // ignore
    }
  };

  const openTeacherProfile = async (course: Course) => {
    setTeacherProfileCourse(course);
    setSelectedRating(5);
    setReviewComment("");
    try {
      const res = await apiClient.getTeacherReviews(course.teacherId);
      setTeacherModalReviews(res.reviews || []);
      if (res.summary) setTeacherModalSummary(res.summary);
      const own = (res.reviews || []).find(
        (r) => r.studentId === currentUser.id && (!r.courseId || r.courseId === course.id),
      );
      if (own) {
        setSelectedRating(own.rating);
        setReviewComment(own.comment);
      }
    } catch {
      setTeacherModalReviews([]);
    }
  };

  const handleSaveReview = async () => {
    if (!teacherProfileCourse || selectedRating < 1) return;
    setIsSubmittingReview(true);
    try {
      const res = await apiClient.submitTeacherReview({
        teacherId: teacherProfileCourse.teacherId,
        courseId: teacherProfileCourse.id,
        rating: selectedRating,
        comment: reviewComment.trim(),
      });
      setTeacherModalSummary(res.summary);
      const refreshed = await apiClient.getTeacherReviews(teacherProfileCourse.teacherId);
      setTeacherModalReviews(refreshed.reviews || []);
      success(
        "Đã gửi đánh giá Sao Giảng viên qua n8n!",
        `Trung bình sao lớn mới của ${teacherProfileCourse.teacherName}: ⭐ ${res.summary.averageRating}/5.0 (${res.summary.totalReviews} đánh giá).`,
      );
      await loadData();
    } catch (err) {
      warning("Không gửi được đánh giá", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitViolationReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCourse || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    try {
      await apiClient.submitCourseReport(reportingCourse.id, {
        reason: reportReason.trim(),
        description: reportDesc.trim(),
      });
      success(
        "Đã gửi báo cáo vi phạm qua n8n tới Admin!",
        `Luồng n8n (/webhook/edumind-course-report) đã chuyển báo cáo khóa học "${reportingCourse.title}" tới Admin để xem xét Tạm khóa hoặc Khóa.`,
      );
      setReportingCourse(null);
      setReportDesc("");
    } catch (err) {
      warning("Không gửi được báo cáo", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.courseId === courseId && e.status === "active");
  };

  const handleEnroll = async (course: Course) => {
    if (!isAuthenticated) {
      info("Cần đăng nhập", "Vui lòng đăng nhập tài khoản Học viên để tham gia lớp học.");
      return;
    }
    try {
      await apiClient.enrollCourse(course.id);
      success("Ghi danh thành công!", `Bạn đã đăng ký tham gia '${course.title}'.`);
      await loadData();
    } catch (err) {
      error("Không thể ghi danh", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDrop = async (course: Course) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy tham gia khóa học '${course.title}'?`)) return;
    try {
      await apiClient.dropCourse(course.id);
      info("Đã hủy ghi danh", `Bạn đã rút khỏi khóa học '${course.title}'.`);
      await loadData();
      if (detailCourse?.id === course.id) {
        setDetailCourse(null);
      }
    } catch (err) {
      error("Không thể hủy ghi danh", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  // Compute Top Rated Teachers Ranking (n8n Big Star Rating)
  const rankedTeachers = React.useMemo(() => {
    const map = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        department: string;
        courseCount: number;
        totalReviews: number;
        avgRating: number;
        sampleCourse: Course | null;
      }
    >();

    for (const c of courses) {
      const existing = map.get(c.teacherId);
      const tUser = teachers.find((u) => u.id === c.teacherId);
      const tRevs = allReviews.filter((r) => r.teacherId === c.teacherId);
      const avg =
        tRevs.length > 0
          ? Number((tRevs.reduce((s, r) => s + Number(r.rating || 0), 0) / tRevs.length).toFixed(2))
          : Number(c.averageRating || 5.0);
      if (!existing) {
        map.set(c.teacherId, {
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          department: tUser?.department || tUser?.institution || c.subjectName,
          courseCount: 1,
          totalReviews: tRevs.length || c.reviewCount || 0,
          avgRating: avg || 5.0,
          sampleCourse: c,
        });
      } else {
        existing.courseCount += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews);
  }, [courses, teachers, allReviews]);

  // Filter logic
  let displayCourses = courses;
  if (viewTab === "my") {
    const enrolledCourseIds = new Set(
      enrollments.filter((e) => e.status === "active").map((e) => e.courseId),
    );
    displayCourses = courses.filter((c) => enrolledCourseIds.has(c.id));
  }

  const filteredCourses = displayCourses.filter((c) => {
    const matchSub = selectedSubject === "all" || c.subjectId === selectedSubject;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  const enrolledCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* STUDOCU-STYLE DISCOVERY HERO & SEARCH BANNER */}
      <div
        style={{
          padding: "24px 26px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #0f766e 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 10px 28px rgba(30, 27, 75, 0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "99px",
                background: "rgba(255,255,255,0.14)",
                color: "#a5f3fc",
                fontSize: "10.5px",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              STUDOCU ACADEMIC HUB · TÌM KIẾM & GỢI Ý HỌC LIỆU THÔNG MINH
            </span>
            <h2 style={{ margin: "8px 0 4px", fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
              Khám phá Khóa học, Môn học, Video Bài giảng & Xếp hạng Giảng viên
            </h2>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#cbd5e1" }}>
              Tìm kiếm nhanh như Studocu · Ghi danh học trực tuyến · Thi trắc nghiệm Azota · Đánh giá Sao Giảng viên & Trợ lý AI đề xuất.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {onAskAITutor && (
              <button
                type="button"
                onClick={() =>
                  onAskAITutor(
                    "Hãy đề xuất cho tôi các khóa học, môn học và bảng xếp hạng đánh giá sao giảng viên nổi bật hiện có trên hệ thống!",
                  )
                }
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(165, 243, 252, 0.4)",
                  background: "rgba(255, 255, 255, 0.14)",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon name="sparkles" size={14} /> Hỏi AI Đề xuất Khóa học & GV
              </button>
            )}
            {onOpenView && (
              <button
                type="button"
                onClick={() => onOpenView("ocr")}
                style={{
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#10b981",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon name="camera" size={14} /> Quét Camera & Upload Tài liệu AI
              </button>
            )}
          </div>
        </div>

        {/* Big Studocu Search Box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 18px",
            borderRadius: "12px",
            background: "#ffffff",
            color: "#0f172a",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="🔍 Tìm kiếm khóa học, môn học, tài liệu bài giảng hoặc tên giảng viên (giống Studocu)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#0f172a",
              background: "transparent",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Xóa
            </button>
          )}
        </div>

        {/* Studocu Quick Suggestion Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
          <span style={{ color: "#a5f3fc", fontWeight: 700 }}>🔥 Gợi ý tìm kiếm nhanh:</span>
          {subjects.slice(0, 6).map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelectedSubject(selectedSubject === sub.id ? "all" : sub.id);
              }}
              style={{
                padding: "4px 11px",
                borderRadius: "99px",
                border: selectedSubject === sub.id ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.22)",
                background: selectedSubject === sub.id ? "#0284c7" : "rgba(255,255,255,0.1)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {sub.name}
            </button>
          ))}
          {onOpenView && (
            <button
              type="button"
              onClick={() => onOpenView("quizzes")}
              style={{
                padding: "4px 11px",
                borderRadius: "99px",
                border: "1px solid #fde68a",
                background: "rgba(251, 191, 36, 0.2)",
                color: "#fef08a",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📝 Phòng Thi Trắc nghiệm Azota & Tự luận →
            </button>
          )}
        </div>
      </div>

      {/* TOP RANKED TEACHERS BAR (N8N AGGREGATED BIG STAR RATING) */}
      {rankedTeachers.length > 0 && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px" }}>🏆</span>
              <strong style={{ fontSize: "13px", color: "#1e293b" }}>
                Bảng xếp hạng Giảng viên được Đánh giá cao (Tổng hợp Trung bình Sao lớn qua n8n)
              </strong>
            </div>
            <span style={{ fontSize: "11px", color: "#047857", fontWeight: 700 }}>
              ⚡ Đồng bộ trực tiếp với AI Chatbox & n8n
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "10px" }}>
            {rankedTeachers.map((t, idx) => (
              <div
                key={t.teacherId}
                style={{
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fde68a",
                  background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "#f59e0b",
                        color: "#fff",
                        fontSize: "9.5px",
                        fontWeight: 800,
                      }}
                    >
                      TOP #{idx + 1}
                    </span>
                    <strong
                      style={{
                        fontSize: "12.5px",
                        color: "#1e293b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.teacherName}
                    </strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 800, marginTop: "3px" }}>
                    ⭐ {t.avgRating.toFixed(1)} / 5.0{" "}
                    <span style={{ color: "#64748b", fontWeight: 500 }}>
                      ({t.totalReviews} đánh giá · {t.courseCount} khóa học)
                    </span>
                  </div>
                </div>

                {t.sampleCourse && (
                  <button
                    type="button"
                    onClick={() => void openTeacherProfile(t.sampleCourse!)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "7px",
                      border: "1px solid #fcd34d",
                      background: "#fef3c7",
                      color: "#92400e",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Đánh giá ★
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Tabs: Explore vs My Enrolled Courses */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
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
            Khóa học & Học liệu gợi ý ({courses.length})
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
            Khóa học đã ghi danh ({enrolledCount})
          </button>
        </div>

        {/* Subjects Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingBottom: "6px" }}>
          <button
            onClick={() => setSelectedSubject("all")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedSubject === "all" ? "1px solid #4f46e5" : "1px solid #e2e8f0",
              background: selectedSubject === "all" ? "#e0e7ff" : "#f8fafc",
              color: selectedSubject === "all" ? "#3730a3" : "#64748b",
            }}
          >
            Tất cả môn
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              style={{
                padding: "5px 11px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                border: selectedSubject === sub.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                background: selectedSubject === sub.id ? "#e0e7ff" : "#f8fafc",
                color: selectedSubject === sub.id ? "#3730a3" : "#64748b",
              }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Courses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {isLoading ? (
          <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Đang tải danh sách khóa học & gợi ý từ hệ thống...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            {viewTab === "my"
              ? "Bạn chưa ghi danh khóa học nào. Chuyển sang tab 'Khóa học & Học liệu gợi ý' để đăng ký."
              : "Không tìm thấy khóa học phù hợp với từ khóa tìm kiếm."}
          </div>
        ) : (
          filteredCourses.map((c) => {
            const enrolled = isEnrolled(c.id);
            const enrData = enrollments.find((e) => e.courseId === c.id && e.status === "active");
            const teacherRevs = allReviews.filter((r) => r.teacherId === c.teacherId);
            const avgStar =
              teacherRevs.length > 0
                ? (teacherRevs.reduce((s, r) => s + Number(r.rating || 0), 0) / teacherRevs.length).toFixed(1)
                : c.averageRating
                ? Number(c.averageRating).toFixed(1)
                : "5.0";

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
                }}
              >
                {/* Visual Banner */}
                <div
                  className={`course-visual ${c.tone || "lavender"}`}
                  style={{ height: "95px", cursor: "pointer" }}
                  onClick={() => void handleOpenDetail(c)}
                >
                  <span className="course-subject">{c.subjectName}</span>
                  <span className="course-mark">{c.badgeMark || "EDU"}</span>
                  <div className="course-visual-orb" />
                </div>

                {/* Content Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => void openTeacherProfile(c)}
                        style={{
                          padding: 0,
                          border: 0,
                          background: "none",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#4f46e5",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        👨‍🏫 GV: {c.teacherName}
                      </button>
                      <button
                        type="button"
                        onClick={() => void openTeacherProfile(c)}
                        style={{
                          padding: "2px 7px",
                          borderRadius: "99px",
                          border: "1px solid #fde68a",
                          background: "#fffbeb",
                          color: "#b45309",
                          fontSize: "10.5px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        ⭐ {avgStar}/5 ({teacherRevs.length || c.reviewCount || 0})
                      </button>
                    </div>

                    <h3
                      onClick={() => void handleOpenDetail(c)}
                      style={{ margin: "5px 0 4px", fontSize: "14px", fontWeight: 700, color: "#1e293b", cursor: "pointer" }}
                    >
                      {c.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b", lineHeight: "1.4" }}>
                      {c.description || "Khóa học trực tuyến trên EduMind AI."}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#94a3b8",
                      paddingTop: "4px",
                    }}
                  >
                    <span>⏱️ {c.durationHours} giờ</span>
                    <span>📚 {c.lessonCount} buổi học</span>
                    <span>👥 {c.enrolledCount} học viên</span>
                  </div>

                  {/* Progress bar if enrolled */}
                  {enrolled && enrData && (
                    <div style={{ marginTop: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#4f46e5", fontWeight: 700, marginBottom: "3px" }}>
                        <span>Tiến độ tham gia buổi học</span>
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

                  {/* Secondary row: Rate Teacher (n8n) + Report Violation (n8n) */}
                  <div style={{ display: "flex", gap: "6px", paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => void openTeacherProfile(c)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "7px",
                        border: "1px solid #fde68a",
                        background: "#fffbeb",
                        color: "#b45309",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ⭐ Đánh giá GV (n8n)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportingCourse(c);
                        setReportReason("Nội dung bài giảng/video vi phạm hoặc không truy cập được");
                        setReportDesc("");
                      }}
                      style={{
                        padding: "6px 9px",
                        borderRadius: "7px",
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="Báo cáo khóa học vi phạm gửi sang Admin qua n8n"
                    >
                      🚨 Báo cáo vi phạm
                    </button>
                  </div>

                  {/* Primary Action buttons */}
                  <div style={{ marginTop: "auto", paddingTop: "6px", display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => void handleOpenDetail(c)}
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
                      Đề cương
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
                          ▶️ Vào Phòng học
                        </button>
                        <button
                          onClick={() => void handleDrop(c)}
                          title="Hủy tham gia khóa học"
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            color: "#64748b",
                            border: "1px solid #cbd5e1",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => void handleEnroll(c)}
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
                        + Đăng ký / Ghi danh học
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
              {detailCourse.description || "Khóa học trực tuyến trên hệ thống EduMind AI."}
            </div>

            <div>
              <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                Đề cương bài giảng ({detailLessons.length} buổi học đã phát hành):
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {detailLessons.length === 0 ? (
                  <div style={{ padding: "12px", borderRadius: "6px", background: "#f8fafc", color: "#94a3b8", fontSize: "12px" }}>
                    Giảng viên đang cập nhật danh sách bài giảng cho khóa học này.
                  </div>
                ) : (
                  detailLessons.map((les, index) => (
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
                  ))
                )}
              </div>
            </div>

            {detailMaterials.length > 0 && (
              <div>
                <strong style={{ fontSize: "13px", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                  Video & Tài liệu học tập ({detailMaterials.length}):
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
                <button
                  type="button"
                  onClick={() => void openTeacherProfile(detailCourse)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    background: "#fffbeb",
                    color: "#b45309",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ⭐ Hồ sơ & Đánh giá GV (n8n)
                </button>
                {isEnrolled(detailCourse.id) ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleEnroll(detailCourse)}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "8px",
                      background: "#4f46e5",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Ghi danh khóa học ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Teacher Profile & n8n Big Star Rating Aggregation Modal */}
      <Modal
        isOpen={!!teacherProfileCourse}
        onClose={() => setTeacherProfileCourse(null)}
        title="Hồ sơ Giảng viên & Đánh giá Sao (n8n tổng hợp)"
        subtitle={
          teacherProfileCourse
            ? `${teacherProfileCourse.teacherName} · ${teacherProfileCourse.subjectName} · ${teacherProfileCourse.title}`
            : undefined
        }
        maxWidth="640px"
      >
        {teacherProfileCourse &&
          (() => {
            const teacher: User | undefined = teachers.find((user) => user.id === teacherProfileCourse.teacherId);
            const teacherCourses = courses.filter((course) => course.teacherId === teacherProfileCourse.teacherId);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 12,
                    background: "linear-gradient(120deg,#fffbeb,#fef3c7)",
                    border: "1px solid #fde68a",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 16,
                        background: "#f59e0b",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 16,
                      }}
                    >
                      {teacher?.avatar || teacherProfileCourse.teacherName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: "#1e293b", fontSize: 16 }}>
                        {teacher?.name || teacherProfileCourse.teacherName}
                      </h3>
                      <div style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
                        {teacher?.institution || teacher?.department || "Giảng viên EduMind AI"}
                      </div>
                      <div style={{ marginTop: 4, color: "#047857", fontSize: 11, fontWeight: 700 }}>
                        {teacherModalSummary.badge}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: 10, background: "#fff", border: "1px solid #fcd34d" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#d97706", lineHeight: 1 }}>
                      ★ {teacherModalSummary.averageRating > 0 ? teacherModalSummary.averageRating.toFixed(1) : "5.0"}
                      <span style={{ fontSize: 12, color: "#92400e" }}>/5.0</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 3 }}>
                      Trung bình sao lớn n8n ({teacherModalSummary.totalReviews} đánh giá)
                    </div>
                  </div>
                </div>

                {/* Submit Review Form (n8n /webhook/edumind-teacher-rating) */}
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid #c7d2fe", background: "#fafaff" }}>
                  <strong style={{ color: "#334155", fontSize: 13 }}>
                    ⭐ Gửi đánh giá số sao & bình luận cho Giảng viên (Tự động tính lại Trung bình Sao lớn qua n8n)
                  </strong>
                  <div role="radiogroup" aria-label="Mức đánh giá" style={{ display: "flex", gap: 6, margin: "8px 0" }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedRating(value)}
                        style={{
                          padding: "2px 6px",
                          border: 0,
                          background: "transparent",
                          color: value <= selectedRating ? "#f59e0b" : "#cbd5e1",
                          fontSize: 24,
                          cursor: "pointer",
                        }}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ alignSelf: "center", color: "#b45309", fontSize: 12, fontWeight: 700 }}>
                      {selectedRating} / 5 sao
                    </span>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Viết bình luận nhận xét của bạn về chất lượng bài giảng, sự nhiệt tình của giảng viên..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                      padding: 10,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      font: "inherit",
                      fontSize: 12,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ color: "#64748b", fontSize: 10.5 }}>
                      Luồng <code>/webhook/edumind-teacher-rating</code> sẽ cập nhật điểm sao lớn vào Profile GV
                    </span>
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => void handleSaveReview()}
                      style={{
                        padding: "8px 14px",
                        border: 0,
                        borderRadius: 8,
                        background: "#4f46e5",
                        color: "#fff",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: isSubmittingReview ? "wait" : "pointer",
                      }}
                    >
                      {isSubmittingReview ? "⏳ Đang đồng bộ n8n..." : "⭐ Gửi Đánh giá & Bình luận"}
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div>
                  <strong style={{ display: "block", marginBottom: 8, color: "#334155", fontSize: 12.5 }}>
                    Bình luận & Số sao từ Sinh viên ({teacherModalReviews.length} đánh giá · {teacherCourses.length} khóa học)
                  </strong>
                  {teacherModalReviews.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                      {teacherModalReviews.map((review) => (
                        <div key={review.id} style={{ padding: 11, borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#334155", fontSize: 11.5 }}>
                            <strong>{review.studentName}</strong>
                            <span style={{ color: "#b45309", fontWeight: 700 }}>
                              {"★".repeat(review.rating)} ({review.rating}/5 sao)
                            </span>
                          </div>
                          {review.comment && (
                            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                      Chưa có bình luận nào. Hãy là sinh viên đầu tiên đánh giá giảng viên!
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Course Violation Report Modal (SV -> n8n -> Admin) */}
      <Modal
        isOpen={!!reportingCourse}
        onClose={() => setReportingCourse(null)}
        title="🚨 Báo cáo Vi phạm Khóa học tới Admin (Luồng n8n)"
        subtitle={
          reportingCourse
            ? `Khóa học: ${reportingCourse.title} · Giảng viên: ${reportingCourse.teacherName}`
            : undefined
        }
        maxWidth="540px"
      >
        {reportingCourse && (
          <form onSubmit={handleSubmitViolationReport} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "11.5px",
                lineHeight: 1.55,
              }}
            >
              <strong>⚡ Tương tác Sinh viên ↔ Admin qua n8n:</strong> Báo cáo của bạn sẽ được gửi qua webhook{" "}
              <code>/webhook/edumind-course-report</code> tới Quản trị viên. Admin có thể quyết định{" "}
              <strong>Tạm khóa (hidden)</strong> hoặc <strong>Khóa vĩnh viễn (archived)</strong> khóa học này.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Lý do báo cáo vi phạm *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#fff",
                }}
              >
                <option value="Nội dung bài giảng/video vi phạm hoặc không truy cập được">
                  Nội dung bài giảng/video vi phạm hoặc không truy cập được
                </option>
                <option value="Tài liệu học tập sai lệch hoặc vi phạm bản quyền">
                  Tài liệu học tập sai lệch hoặc vi phạm bản quyền
                </option>
                <option value="Đề thi / Đáp án trắc nghiệm có sai sót nghiêm trọng">
                  Đề thi / Đáp án trắc nghiệm có sai sót nghiêm trọng
                </option>
                <option value="Nội dung spam hoặc không đúng chương trình môn học">
                  Nội dung spam hoặc không đúng chương trình môn học
                </option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mô tả chi tiết bằng chứng vi phạm (Bổ sung cho Admin)
              </label>
              <textarea
                rows={4}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Mô tả cụ thể buổi học, video hoặc nội dung vi phạm để Admin kiểm tra và xử lý..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setReportingCourse(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmittingReport}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: isSubmittingReport ? "wait" : "pointer",
                }}
              >
                {isSubmittingReport ? "⏳ Đang gửi qua n8n..." : "🚨 Gửi Báo cáo tới Admin (n8n)"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
