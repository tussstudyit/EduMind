// ============================================================================
// EDUMIND AI - UNIVERSAL TOPBAR COMPONENT
// Thanh điều hướng trên cùng dành riêng cho FE Desktop.
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";
import { NotificationDrawer } from "./NotificationDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { apiClient } from "@/services/apiClient";

interface TopbarProps {
  onSearch?: (query: string) => void;
  onNavigate?: (view: string) => void;
}

export function Topbar({ onSearch, onNavigate }: TopbarProps) {
  const { currentUser, role, isAuthenticated, signOut } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const local = storageService.getNotifications(currentUser.id);
    if (!isAuthenticated) {
      setUnreadCount(local.filter((notification) => !notification.isRead).length);
      return () => {
        isMounted = false;
      };
    }

    apiClient
      .getNotifications()
      .then((serverNotifications) => {
        if (!isMounted) return;
        const merged = new Map(local.map((notification) => [notification.id, notification]));
        serverNotifications.forEach((notification) => merged.set(notification.id, notification));
        setUnreadCount([...merged.values()].filter((notification) => !notification.isRead).length);
      })
      .catch(() => {
        if (isMounted) setUnreadCount(local.filter((notification) => !notification.isRead).length);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, isNotifOpen, isAuthenticated]);

  const roleLabel = !isAuthenticated
    ? "Chưa đăng nhập"
    : role === "admin"
    ? "Quản trị viên"
    : role === "teacher"
    ? "Giảng viên"
    : "Học viên";

  const roleColor = !isAuthenticated
    ? { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" }
    : role === "admin"
    ? { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" }
    : role === "teacher"
    ? { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" }
    : { bg: "#d1fae5", text: "#047857", border: "#6ee7b7" };

  return (
    <>
      <header className="topbar">
        {/* Search Bar */}
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder={
              role === "admin"
                ? "Tìm người dùng, môn học, nhật ký..."
                : role === "teacher"
                ? "Tìm khóa học, bài nộp, câu hỏi..."
                : "Tìm khóa học, bài học, tài liệu..."
            }
            aria-label="Tìm kiếm hệ thống"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>

        {/* Actions & Profile */}
        <div className="topbar-actions">
          <div style={{ position: "relative", order: 3 }}>
            <button
              className="topbar-profile"
              type="button"
              aria-label={isAuthenticated ? `Tài khoản của ${currentUser.name}` : "Đăng nhập"}
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-controls="topbar-account-menu"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              title={isAuthenticated ? "Mở tùy chọn tài khoản" : "Đăng nhập hoặc đăng ký"}
              style={{
                padding: "5px 8px",
                border: `1px solid ${isAccountMenuOpen ? "#c7d2fe" : "transparent"}`,
                borderRadius: "9px",
                background: isAccountMenuOpen ? "#f8faff" : "transparent",
                color: "#334155",
                textAlign: "left",
                cursor: "pointer",
              }}
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
                {isAuthenticated ? currentUser.avatar : "?"}
              </div>
              <div className="topbar-profile-copy">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong>{isAuthenticated ? currentUser.name : "Đăng nhập"}</strong>
                  {isAuthenticated && (
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "999px",
                        background: roleColor.bg,
                        color: roleColor.text,
                        fontSize: "9px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {roleLabel}
                    </span>
                  )}
                </div>
                <span>
                  {isAuthenticated
                    ? currentUser.institution || currentUser.department || currentUser.email
                    : "Để truy cập tài khoản"}
                </span>
              </div>
              <Icon name="chevron" size={13} />
            </button>
            {isAccountMenuOpen && (
              <div
                id="topbar-account-menu"
                role="menu"
                aria-label="Tùy chọn tài khoản"
                style={{
                  position: "absolute",
                  zIndex: 40,
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "236px",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  background: "#ffffff",
                  boxShadow: "0 12px 32px rgba(15, 23, 42, .14)",
                }}
              >
                <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: "6px" }}>
                  {isAuthenticated ? (
                    <>
                      <strong style={{ display: "block", fontSize: "12px", color: "#1e293b", marginBottom: "2px" }}>
                        {currentUser.name} ({roleLabel})
                      </strong>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", overflowWrap: "anywhere" }}>
                        {currentUser.email}
                      </span>
                    </>
                  ) : (
                    <strong style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>
                      Bạn chưa đăng nhập
                    </strong>
                  )}
                </div>
                {isAuthenticated && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onNavigate?.("profile");
                    }}
                    style={accountMenuItemStyle}
                  >
                    Hồ sơ cá nhân
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    setIsAuthOpen(true);
                  }}
                  style={accountMenuItemStyle}
                >
                  {isAuthenticated ? "Đổi tài khoản / đăng nhập khác" : "Đăng nhập hoặc đăng ký"}
                </button>
                {isAuthenticated && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      signOut();
                      setIsAccountMenuOpen(false);
                      setIsAuthOpen(true);
                    }}
                    style={accountMenuItemStyle}
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notification Button with unread count */}
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="Thông báo"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{ position: "relative", order: 1 }}
          >
            <Icon name="bell" size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  padding: "0 4px",
                  border: "2px solid #ffffff",
                  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="topbar-divider" style={{ order: 2 }} />
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={onNavigate}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

const accountMenuItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  border: 0,
  borderRadius: "7px",
  background: "transparent",
  color: "#334155",
  fontSize: "12px",
  textAlign: "left",
  cursor: "pointer",
};
