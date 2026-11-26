// ============================================================================
// EDUMIND AI - DYNAMIC RBAC SIDEBAR COMPONENT
// Điều hướng theo vai trò (Admin / Teacher / Student) & Hồ sơ cá nhân
// Giữ nguyên 100% giao diện Desktop gốc; hỗ trợ Drawer & Bottom Nav riêng cho Mobile (<= 680px)
// ============================================================================

"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Icon, IconName } from "@/components/ui/Icons";
import { BrandMark } from "@/components/ui/BrandMark";

export interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
  badge?: string;
}

interface SidebarProps {
  activeView: string;
  onSelectView: (viewId: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onOpenMobileDrawer?: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  onOpenMobileDrawer,
}: SidebarProps) {
  const { role } = useAuth();

  // Danh mục điều hướng chuyên biệt theo Role (Giữ nguyên 100% thứ tự và nhãn gốc trên Desktop)
  const navItems: NavItem[] = React.useMemo(() => {
    if (role === "admin") {
      return [
        { id: "admin_dashboard", label: "Tổng quan Quản trị", shortLabel: "Tổng quan", icon: "chart" },
        { id: "admin_users", label: "Tài khoản & Quyền", shortLabel: "Tài khoản", icon: "users" },
        { id: "admin_subjects", label: "Môn học & Chủ đề", shortLabel: "Môn học", icon: "book" },
        { id: "admin_courses", label: "Quản lý Khóa học", shortLabel: "Khóa học", icon: "fileText" },
        { id: "admin_system", label: "Nhật ký & Cấu hình AI", shortLabel: "AI & Log", icon: "settings" },
      ];
    } else if (role === "teacher") {
      return [
        { id: "teacher_dashboard", label: "Bàn làm việc", shortLabel: "Tổng quan", icon: "home" },
        { id: "teacher_courses", label: "Khóa học của tôi", shortLabel: "Khóa học", icon: "book" },
        { id: "teacher_quizzes", label: "Đề thi & Câu hỏi", shortLabel: "Đề thi", icon: "fileText" },
        { id: "teacher_grading", label: "Chấm điểm bài nộp", shortLabel: "Chấm bài", icon: "award", badge: "Mới" },
        { id: "teacher_progress", label: "Tiến độ học viên", shortLabel: "Tiến độ", icon: "chart" },
        { id: "teacher_ocr", label: "Quét Camera & Upload AI", shortLabel: "Camera AI", icon: "camera", badge: "AI" },
      ];
    } else {
      return [
        { id: "student_dashboard", label: "Tổng quan", shortLabel: "Tổng quan", icon: "home" },
        { id: "student_library", label: "Thư viện tài liệu", shortLabel: "Thư viện", icon: "book" },
        { id: "student_courses", label: "Lớp học & Giảng viên", shortLabel: "Lớp học", icon: "users" },
        { id: "student_learn", label: "Phòng học & Bài giảng", shortLabel: "Phòng học", icon: "play" },
        { id: "student_quiz", label: "Làm bài kiểm tra", shortLabel: "Kiểm tra", icon: "award" },
        { id: "student_tutor", label: "AI Tutor", shortLabel: "AI Tutor", icon: "sparkles", badge: "HOT" },
        { id: "student_ocr", label: "Quét tài liệu OCR", shortLabel: "Quét OCR", icon: "camera" },
        { id: "student_recommendations", label: "Đề xuất học tập AI", shortLabel: "Đề xuất AI", icon: "chart", badge: "AI" },
      ];
    }
  }, [role]);

  // 4 tab chính hiển thị trên thanh Bottom Tab Bar chỉ riêng cho Mobile (<= 680px)
  const primaryMobileTabs = React.useMemo(() => {
    if (role === "student") {
      return [
        navItems.find((i) => i.id === "student_dashboard")!,
        navItems.find((i) => i.id === "student_learn")!,
        navItems.find((i) => i.id === "student_tutor")!,
        navItems.find((i) => i.id === "student_ocr")!,
      ].filter(Boolean);
    }
    return navItems.slice(0, 4);
  }, [role, navItems]);

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    onCloseMobileDrawer?.();
  };

  return (
    <>
      {isMobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={onCloseMobileDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${isMobileDrawerOpen ? " sidebar-mobile-open" : ""}`}
        aria-label="Thanh điều hướng chính"
      >
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

        <button
          type="button"
          className="mobile-drawer-close"
          onClick={onCloseMobileDrawer}
          aria-label="Đóng menu điều hướng"
        >
          <Icon name="x" size={18} />
        </button>

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

      {/* Thanh điều hướng dưới đáy (Chỉ hiển thị trên màn hình Mobile <= 680px) */}
      <nav className="mobile-nav" aria-label="Điều hướng di động">
        {primaryMobileTabs.map((item) => {
          const isActive = activeView === item.id && !isMobileDrawerOpen;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item${isActive ? " active" : ""}`}
              onClick={() => handleSelect(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.shortLabel || item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`mobile-nav-item${isMobileDrawerOpen ? " active" : ""}`}
          onClick={() => (isMobileDrawerOpen ? onCloseMobileDrawer?.() : onOpenMobileDrawer?.())}
          aria-label="Mở toàn bộ danh mục"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Danh mục</span>
        </button>
      </nav>
    </>
  );
}
