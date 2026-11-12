// ============================================================================
// EDUMIND AI - USER PROFILE & SETTINGS COMPONENT (MODULE 1)
// Xem & sửa thông tin cá nhân, cập nhật tiểu sử và đổi mật khẩu
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { storageService } from "@/services/storageService";
import { Icon } from "@/components/ui/Icons";

export function ProfileView() {
  const { currentUser, updateCurrentUserProfile, role } = useAuth();
  const { success, error } = useToast();

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [dept, setDept] = useState(currentUser.department || "");
  const [bio, setBio] = useState(currentUser.bio || "");

  // Change password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Lỗi", "Họ tên không được để trống.");
      return;
    }

    updateCurrentUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      department: dept.trim(),
      bio: bio.trim(),
    });

    success("Đã cập nhật hồ sơ cá nhân", "Thông tin mới đã được lưu thành công.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      error("Lỗi", "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPass.length < 6) {
      error("Lỗi", "Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }
    if (newPass !== confirmPass) {
      error("Lỗi", "Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    const res = storageService.changePassword(currentUser.id, currentPass, newPass);
    if (res.success) {
      success("Đổi mật khẩu thành công!", "Mật khẩu của bạn đã được cập nhật an toàn.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } else {
      error("Thất bại", res.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 1: QUẢN LÝ HỒ SƠ & TÀI KHOẢN CÁ NHÂN</span>
          <h2>Hồ Sơ Của Bạn</h2>
        </div>
      </div>

      {/* Profile Card Banner */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: "14px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background:
              role === "admin"
                ? "linear-gradient(135deg, #f87171, #dc2626)"
                : role === "teacher"
                ? "linear-gradient(135deg, #60a5fa, #2563eb)"
                : "linear-gradient(135deg, #34d399, #059669)",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            fontSize: "20px",
            fontWeight: 800,
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
          }}
        >
          {currentUser.avatar}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>{currentUser.name}</h2>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                background:
                  role === "admin"
                    ? "#fee2e2"
                    : role === "teacher"
                    ? "#dbeafe"
                    : "#ecfdf5",
                color:
                  role === "admin"
                    ? "#b91c1c"
                    : role === "teacher"
                    ? "#1d4ed8"
                    : "#047857",
              }}
            >
              {role.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
            {currentUser.email} · {currentUser.department || "Thành viên EduMind AI"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            Tham gia từ: {new Date(currentUser.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>
      </div>

      {/* Two Columns: Edit Info on Left, Change Password on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        {/* Edit Info */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <span className="eyebrow">CẬP NHẬT THÔNG TIN</span>
              <h2>Thông tin cá nhân</h2>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Email (Định danh)
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", background: "#f8fafc", color: "#94a3b8" }}
              />
              <span style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "3px", display: "block" }}>
                Địa chỉ email được quản lý bởi Quản trị viên hệ thống.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Số điện thoại
                </label>
                <input
                  type="text"
                  placeholder="09..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Khoa / Lớp học
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Giới thiệu bản thân (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Chia sẻ về sở thích học tập, nghiên cứu..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                alignSelf: "flex-end",
                padding: "8px 18px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Lưu thay đổi hồ sơ
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <span className="eyebrow">BẢO MẬT TÀI KHOẢN</span>
              <h2>Đổi mật khẩu</h2>
            </div>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mật khẩu mới (≥ 6 ký tự) *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
