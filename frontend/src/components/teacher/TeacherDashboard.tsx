// ============================================================================
// EDUMIND AI - TEACHER DASHBOARD COMPONENT
// Bàn làm việc giảng viên, thông báo bài nộp cần chấm & thống kê lớp học
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";

interface TeacherDashboardProps {
  onNavigate: (viewId: string) => void;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState(storageService.getCourses("teacher", currentUser.id));
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const myCourses = storageService.getCourses("teacher", currentUser.id);
    setCourses(myCourses);

    // Tìm các bài nộp cần chấm tự luận
    const allAttempts = storageService.getAttempts();
    const pending = allAttempts.filter(
      (a) => a.status === "submitted" && myCourses.some((c) => c.id === a.courseId)
    );
    setPendingSubmissions(pending);

    // Tính tổng số học viên ghi danh
    const enrollments = storageService.getEnrollments();
    const myEnr = enrollments.filter((e) => myCourses.some((c) => c.id === e.courseId));
    setTotalStudents(myEnr.length);
  }, [currentUser.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Banner */}
      <div className="welcome-row">
        <div>
          <span className="welcome-kicker">KHÔNG GIAN GIẢNG VIÊN</span>
          <h1>Chào Thầy {currentUser.name} 🎓</h1>
          <p>Quản lý giáo án, ngân hàng đề thi và theo dõi sát sao tiến độ học tập của từng sinh viên.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onNavigate("teacher_courses")}
            className="quick-action"
            style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
          >
            <span>+</span> Soạn khóa học mới
          </button>
          <button
            onClick={() => onNavigate("teacher_quizzes")}
            className="quick-action"
            style={{ cursor: "pointer", background: "#f8fafc" }}
          >
            <Icon name="award" size={14} /> Tạo đề kiểm tra
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-purple">
            <Icon name="book" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Khóa học phụ trách</span>
            <strong className="stat-value">{courses.length}</strong>
            <span className="stat-detail">{courses.filter((c) => c.status === "published").length} đã xuất bản</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-blue">
            <Icon name="users" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Học viên đang học</span>
            <strong className="stat-value">{totalStudents}</strong>
            <span className="stat-detail">Ghi danh hoạt động</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-orange">
            <Icon name="award" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Bài nộp cần chấm</span>
            <strong className="stat-value" style={{ color: pendingSubmissions.length > 0 ? "#dc2626" : "#303847" }}>
              {pendingSubmissions.length}
            </strong>
            <span className="stat-detail">Đang chờ chấm tự luận</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-green">
            <Icon name="chart" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tỷ lệ hoàn thành</span>
            <strong className="stat-value">76%</strong>
            <span className="stat-detail">Tiến độ chung các lớp</span>
          </div>
        </div>
      </div>

      {/* Pending Grading Alert Banner */}
      {pendingSubmissions.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "10px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#d97706" }}><Icon name="alertCircle" size={20} /></span>
            <div>
              <strong style={{ fontSize: "13px", color: "#92400e" }}>
                Có {pendingSubmissions.length} bài làm của học viên đang chờ bạn chấm điểm & nhận xét!
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b45309" }}>
                Học viên đã nộp bài. Phần trắc nghiệm đã được chấm tự động, hãy chấm phần tự luận để công bố điểm.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("teacher_grading")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              background: "#d97706",
              color: "#fff",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Chấm bài ngay
          </button>
        </div>
      )}

      {/* Courses overview */}
      <div className="panel">
        <div className="panel-heading" style={{ marginBottom: "14px" }}>
          <div>
            <span className="eyebrow">KHÓA HỌC BẠN ĐANG PHỤ TRÁCH</span>
            <h2>Danh sách Lớp học & Giáo án</h2>
          </div>
          <button
            onClick={() => onNavigate("teacher_courses")}
            className="text-link"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            Quản lý chi tiết <Icon name="arrow" size={13} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{course.subjectName}</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    background: course.status === "published" ? "#ecfdf5" : "#fffbeb",
                    color: course.status === "published" ? "#065f46" : "#b45309",
                  }}
                >
                  {course.status.toUpperCase()}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{course.title}</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                {course.description.substring(0, 75)}...
              </p>
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "8px",
                  borderTop: "1px solid #edf2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10.5px",
                  color: "#94a3b8",
                }}
              >
                <span>{course.lessonCount} Bài học</span>
                <span>{course.enrolledCount} Học viên</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
