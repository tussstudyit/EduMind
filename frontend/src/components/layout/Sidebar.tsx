// ============================================================================
// EDUMIND AI - DYNAMIC RBAC SIDEBAR COMPONENT
// Điều hướng theo vai trò (Admin / Teacher / Student) & Hồ sơ cá nhân
// ============================================================================

"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Icon, IconName } from "@/components/ui/Icons";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
}

interface SidebarProps {
  activeView: string;
  onSelectView: (viewId: string) => void;
}

export function Sidebar({ activeView, onSelectView }: SidebarProps) {
  const { role, currentUser } = useAuth();

  // Danh mục điều hướng chuyên biệt theo Role
  const navItems: NavItem[] = React.useMemo(() => {
    if (role === "admin") {
      return [
        { id: "admin_dashboard", label: "Tổng quan Quản trị", icon: "chart" },
        { id: "admin_users", label: "Tài khoản & Quyền", icon: "users" },
        { id: "admin_subjects", label: "Môn học & Chủ đề", icon: "book" },
        { id: "admin_courses", label: "Quản lý Khóa học", icon: "fileText" },
        { id: "admin_system", label: "Nhật ký & Cấu hình AI", icon: "settings" },
      ];
    } else if (role === "teacher") {
      return [
        { id: "teacher_dashboard", label: "Bàn làm việc", icon: "home" },
        { id: "teacher_courses", label: "Khóa học của tôi", icon: "book" },
        { id: "teacher_quizzes", label: "Đề thi & Câu hỏi", icon: "fileText" },
        { id: "teacher_grading", label: "Chấm điểm bài nộp", icon: "award", badge: "Mới" },
        { id: "teacher_progress", label: "Tiến độ học viên", icon: "chart" },
      ];
    } else {
      return [
        { id: "student_dashboard", label: "Tổng quan", icon: "home" },
        { id: "student_courses", label: "Khám phá Khóa học", icon: "book" },
        { id: "student_learn", label: "Phòng học & Bài giảng", icon: "play" },
        { id: "student_quiz", label: "Làm bài kiểm tra", icon: "award" },
        { id: "student_tutor", label: "AI Tutor", icon: "sparkles", badge: "HOT" },
        { id: "student_ocr", label: "Quét tài liệu OCR", icon: "camera" },
        { id: "student_recommendations", label: "Đề xuất học tập AI", icon: "sparkles", badge: "AI" },
      ];
    }
  }, [role]);

  return (
    <aside className="sidebar" aria-label="Thanh điều hướng chính">
      {/* Brand */}
      <a
        className="brand"
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectView(navItems[0].id);
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="brand-name">
          EduMind <b>AI</b>
        </span>
      </a>

      {/* Label section */}
      <div className="sidebar-label">
        {role === "admin"
          ? "QUẢN TRỊ TOÀN TRƯỜNG"
          : role === "teacher"
          ? "KHÔNG GIAN GIẢNG DẠY"
          : "KHÔNG GIAN HỌC TẬP"}
      </div>

      {/* Nav List */}
      <nav className="side-nav">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link${isActive ? " active" : ""}`}
              onClick={() => onSelectView(item.id)}
              style={{
                width: "100%",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                background: isActive ? "#f0efff" : "transparent",
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-new">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Info */}
      <div className="sidebar-bottom">
        {role === "student" && (
          <div className="streak-card">
            <div className="streak-icon" aria-hidden="true">✦</div>
            <div>
              <strong>Giữ nhịp học nhé!</strong>
              <p>Học 20 phút mỗi ngày để duy trì chuỗi của bạn.</p>
            </div>
            <div className="streak-days">
              <span>4</span> ngày
            </div>
          </div>
        )}

        {role === "teacher" && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              marginBottom: "14px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af" }}>
              💡 Mẹo giảng dạy
            </div>
            <div style={{ fontSize: "10px", color: "#3b82f6", marginTop: "3px" }}>
              Đáp án đúng của đề kiểm tra được bảo mật hoàn toàn trước học viên.
            </div>
          </div>
        )}

        {role === "admin" && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              marginBottom: "14px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b" }}>
              🛡️ Quyền Quản trị viên
            </div>
            <div style={{ fontSize: "10px", color: "#b91c1c", marginTop: "3px" }}>
              Bạn có quyền cao nhất để cấp vai trò và quản lý cấu hình AI.
            </div>
          </div>
        )}

        {/* Profile Settings shortcut link */}
        <button
          type="button"
          onClick={() => onSelectView("profile")}
          className={`nav-link${activeView === "profile" ? " active" : ""}`}
          style={{
            width: "100%",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          <Icon name="settings" size={17} />
          <span>Hồ sơ & Đổi mật khẩu</span>
        </button>

        {/* Profile Row */}
        <div
          className="profile-row"
          onClick={() => onSelectView("profile")}
          style={{ cursor: "pointer" }}
          title="Xem & Chỉnh sửa Hồ sơ"
        >
          <div
            className="avatar"
            style={{
              background:
                role === "admin"
                  ? "linear-gradient(140deg, #fca5a5, #ef4444)"
                  : role === "teacher"
                  ? "linear-gradient(140deg, #93c5fd, #3b82f6)"
                  : "linear-gradient(140deg, #ffdfc6, #f2b89e)",
              color: role === "student" ? "#7e4537" : "#ffffff",
            }}
          >
            {currentUser.avatar}
          </div>
          <div className="profile-copy">
            <strong>{currentUser.name}</strong>
            <span style={{ textTransform: "capitalize" }}>
              {role === "admin" ? "Quản trị viên" : role === "teacher" ? "Giảng viên" : "Học viên"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
