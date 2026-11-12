// ============================================================================
// EDUMIND AI - DEV ROLE SWITCHER
// Thanh chuyển đổi nhanh vai trò (Admin / Teacher / Student) & Khôi phục dữ liệu
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";
import { UserRole } from "@/types";

export function DevRoleSwitcher() {
  const { role, currentUser, switchRole } = useAuth();
  const { info, success } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === role) return;
    switchRole(newRole);
    info(
      `Đã chuyển vai trò: ${newRole.toUpperCase()}`,
      `Hiện đang xem giao diện với quyền ${
        newRole === "admin"
          ? "Quản trị viên (Nguyễn Quản Trị)"
          : newRole === "teacher"
          ? "Giảng viên (ThS. Nguyễn Hoàng Nam)"
          : "Học viên (Trần Minh Anh)"
      }`
    );
  };

  const handleResetFactory = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu (13 Module) về mặc định không?")) {
      storageService.resetToFactoryDefaults();
      success("Đã khôi phục dữ liệu gốc!", "Tất cả các bảng Mock Data đã trở về trạng thái ban đầu.");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          borderRadius: "30px",
          background: "#1e1b4b",
          color: "#ffffff",
          border: "1px solid #4338ca",
          boxShadow: "0 10px 25px rgba(30, 27, 75, 0.4)",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
        title="Mở thanh chuyển đổi vai trò (Dev Role Switcher)"
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: role === "admin" ? "#ef4444" : role === "teacher" ? "#3b82f6" : "#10b981",
          }}
        />
        <span>ROLE: {role.toUpperCase()}</span>
        <Icon name="chevron" size={12} />
      </button>
    );
  }

  return (
    <aside
      aria-label="Thanh công cụ kiểm thử vai trò"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px 14px",
        borderRadius: "14px",
        background: "#0f172a",
        color: "#f8fafc",
        border: "1px solid #334155",
        boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minWidth: "280px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "grid",
              width: "20px",
              height: "20px",
              placeItems: "center",
              borderRadius: "5px",
              background: "#4f46e5",
              color: "#fff",
            }}
          >
            <Icon name="sparkles" size={12} />
          </div>
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "1px", color: "#94a3b8" }}>
            DEV ROLE SWITCHER
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={handleResetFactory}
            title="Khôi phục Mock Data ban đầu"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "4px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "3px 6px",
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Icon name="refresh" size={10} /> Reset
          </button>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "3px",
            }}
            title="Thu nhỏ thanh công cụ"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      </div>

      {/* Current Active User Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 8px",
          borderRadius: "8px",
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: "10px",
            fontWeight: 800,
            background: role === "admin" ? "#dc2626" : role === "teacher" ? "#2563eb" : "#059669",
            color: "#ffffff",
          }}
        >
          {currentUser.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#f1f5f9", truncate: "ellipsis" }}>
            {currentUser.name}
          </div>
          <div style={{ fontSize: "9px", color: "#94a3b8" }}>{currentUser.email}</div>
        </div>
        <span
          style={{
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "8.5px",
            fontWeight: 800,
            background:
              role === "admin"
                ? "rgba(239, 68, 68, 0.2)"
                : role === "teacher"
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(16, 185, 129, 0.2)",
            color: role === "admin" ? "#f87171" : role === "teacher" ? "#60a5fa" : "#34d399",
            border: `1px solid ${
              role === "admin"
                ? "rgba(239, 68, 68, 0.4)"
                : role === "teacher"
                ? "rgba(59, 130, 246, 0.4)"
                : "rgba(16, 185, 129, 0.4)"
            }`,
          }}
        >
          {role.toUpperCase()}
        </span>
      </div>

      {/* Role Switch Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
        {/* Admin button */}
        <button
          onClick={() => handleRoleChange("admin")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 0",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 700,
            cursor: "pointer",
            border: role === "admin" ? "1px solid #ef4444" : "1px solid #334155",
            background: role === "admin" ? "#7f1d1d" : "#1e293b",
            color: role === "admin" ? "#fecaca" : "#cbd5e1",
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="shield" size={11} /> Admin
        </button>

        {/* Teacher button */}
        <button
          onClick={() => handleRoleChange("teacher")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 0",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 700,
            cursor: "pointer",
            border: role === "teacher" ? "1px solid #3b82f6" : "1px solid #334155",
            background: role === "teacher" ? "#1e3a8a" : "#1e293b",
            color: role === "teacher" ? "#bfdbfe" : "#cbd5e1",
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="award" size={11} /> Teacher
        </button>

        {/* Student button */}
        <button
          onClick={() => handleRoleChange("student")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 0",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 700,
            cursor: "pointer",
            border: role === "student" ? "1px solid #10b981" : "1px solid #334155",
            background: role === "student" ? "#064e3b" : "#1e293b",
            color: role === "student" ? "#a7f3d0" : "#cbd5e1",
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="book" size={11} /> Student
        </button>
      </div>
    </aside>
  );
}
