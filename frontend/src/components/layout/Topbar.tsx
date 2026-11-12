// ============================================================================
// EDUMIND AI - UNIVERSAL TOPBAR COMPONENT
// Thanh điều hướng trên cùng tích hợp Role badge, Tìm kiếm, Hồ sơ & Đăng nhập
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";
import { NotificationDrawer } from "./NotificationDrawer";
import { AuthModal } from "@/components/auth/AuthModal";

interface TopbarProps {
  onSearch?: (query: string) => void;
  onNavigate?: (view: string) => void;
}

export function Topbar({ onSearch, onNavigate }: TopbarProps) {
  const { currentUser, role } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const list = storageService.getNotifications(currentUser.id);
    setUnreadCount(list.filter((n) => !n.isRead).length);
  }, [currentUser.id, isNotifOpen]);

  const roleLabel =
    role === "admin" ? "Quản trị viên" : role === "teacher" ? "Giảng viên" : "Học viên";

  const roleColor =
    role === "admin"
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
          {/* Role Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: roleColor.bg,
              color: roleColor.text,
              border: `1px solid ${roleColor.border}`,
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: roleColor.text,
              }}
            />
            {roleLabel}
          </div>

          {/* Quick Login / Switch Account Button */}
          <button
            onClick={() => setIsAuthOpen(true)}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              fontSize: "11px",
              fontWeight: 650,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Đăng nhập / Đổi tài khoản khác"
          >
            <Icon name="user" size={13} />
            <span>Tài khoản</span>
          </button>

          {/* Notification Button with unread count */}
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="Thông báo"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{ position: "relative" }}
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

          <div className="topbar-divider" />

          {/* Profile User (Click to view Profile) */}
          <div
            className="topbar-profile"
            onClick={() => onNavigate?.("profile")}
            style={{ cursor: "pointer" }}
            title="Xem & Sửa Hồ sơ cá nhân"
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
            <div className="topbar-profile-copy">
              <strong>{currentUser.name}</strong>
              <span>{currentUser.department || roleLabel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}
