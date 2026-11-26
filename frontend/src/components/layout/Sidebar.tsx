// ============================================================================
// EDUMIND AI - DYNAMIC RBAC SIDEBAR COMPONENT
// Điều hướng theo vai trò (Admin / Teacher / Student) & Hồ sơ cá nhân
// Thanh điều hướng cố định dành riêng cho FE Desktop.
// ============================================================================

"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Icon, IconName } from "@/components/ui/Icons";
import { BrandMark } from "@/components/ui/BrandMark";

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
  const { role } = useAuth();

  // Danh mục điều hướng chuyên biệt theo Role (Theo đúng kế hoạch kiến trúc 3 nhóm Admin / GV / SV)
  const navItems: NavItem[] = React.useMemo(() => {
    if (role === "admin") {
      return [
        { id: "admin_dashboard", label: "Dashboard Quản trị", icon: "chart" },
        { id: "admin_users", label: "Quản lý Tài khoản (n8n)", icon: "users" },
        { id: "admin_courses", label: "Khóa học & Báo cáo (n8n)", icon: "fileText", badge: "n8n" },
        { id: "admin_system", label: "Cấu hình AI & Nhật ký", icon: "settings" },
      ];
    } else if (role === "teacher") {
      return [
        { id: "teacher_dashboard", label: "Dashboard Giảng viên", icon: "home" },
        { id: "teacher_courses", label: "Quản lý Khóa học & Buổi", icon: "book" },
        { id: "teacher_quizzes", label: "Đề thi & Câu hỏi (Azota)", icon: "fileText" },
        { id: "teacher_grading", label: "Chấm điểm Trắc nghiệm/TL", icon: "award", badge: "n8n" },
        { id: "teacher_progress", label: "Tiến độ & Nhắc học (n8n)", icon: "chart" },
        { id: "teacher_ocr", label: "Quét Camera & Upload AI", icon: "camera", badge: "AI" },
        { id: "profile", label: "Profile & Đánh giá Sao", icon: "users", badge: "⭐" },
      ];
    } else {
      return [
        { id: "student_courses", label: "Tìm kiếm & Gợi ý (Studocu)", icon: "book", badge: "HOT" },
        { id: "student_learn", label: "Phòng học trực tuyến", icon: "play" },
        { id: "student_quiz", label: "Thi Trắc nghiệm & Tự luận", icon: "award" },
        { id: "student_tutor", label: "Trợ lý AI Chatbox", icon: "sparkles", badge: "AI" },
        { id: "student_ocr", label: "Quét Camera & Upload AI", icon: "camera" },
      ];
    }
  }, [role]);

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
  };

  return (
      <aside className="sidebar" aria-label="Thanh điều hướng chính">
        {/* Brand (Giữ nguyên cấu trúc DOM gốc trên Desktop) */}
        <a
          className="brand"
          aria-label="EduMind AI — Smart Learning. Future Minds."
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleSelect(navItems[0].id);
          }}
        >
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-copy">
            <span className="brand-name">
              EduMind <b>AI</b>
            </span>
            <span className="brand-tagline">SMART LEARNING · FUTURE MINDS</span>
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

        {/* Nav List (Không dùng flex:1 hay overflowY:auto để giữ nguyên khoảng cách gap:4px và vạch active::before bên trái) */}
        <nav className="side-nav">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link${isActive ? " active" : ""}`}
                onClick={() => handleSelect(item.id)}
                style={{
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  background: isActive ? "#eef2ff" : "transparent",
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
                <p>Học đều đặn mỗi ngày để hoàn thành mục tiêu khóa học của bạn.</p>
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
            onClick={() => handleSelect("profile")}
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
        </div>
      </aside>
  );
}
