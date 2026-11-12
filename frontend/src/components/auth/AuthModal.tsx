// ============================================================================
// EDUMIND AI - AUTH MODAL (LOGIN, REGISTER, FORGOT PASSWORD)
// Module 1: Đăng nhập, Đăng ký, Quên mật khẩu & Chuyển đổi tài khoản nhanh
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { storageService } from "@/services/storageService";
import { UserRole } from "@/types";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register" | "forgot";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { switchUser, switchRole } = useAuth();
  const { success, error, info } = useToast();

  const [tab, setTab] = useState<"login" | "register" | "forgot">(defaultTab);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("student");
  const [regPhone, setRegPhone] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [newPass, setNewPass] = useState("");

  // Quick switch credentials
  const handleQuickLogin = (role: UserRole) => {
    switchRole(role);
    success(
      "Đăng nhập thành công!",
      `Đã đăng nhập với tài khoản mẫu ${role.toUpperCase()}.`
    );
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      error("Lỗi", "Vui lòng nhập email.");
      return;
    }
    const res = storageService.login(loginEmail, loginPass);
    if (res.success && res.user) {
      switchUser(res.user.id);
      success("Đăng nhập thành công!", `Chào mừng ${res.user.name} trở lại EduMind AI.`);
      onClose();
    } else {
      error("Đăng nhập thất bại", res.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      error("Lỗi", "Vui lòng điền họ tên và email hợp lệ.");
      return;
    }
    if (regPass.length < 6) {
      error("Mật khẩu yếu", "Mật khẩu phải có từ 6 ký tự trở lên.");
      return;
    }
    if (regPass !== regConfirmPass) {
      error("Mật khẩu không khớp", "Xác nhận mật khẩu không trùng khớp.");
      return;
    }

    const res = storageService.register(regName, regEmail, regRole, regPhone, regDept);
    if (res.success && res.user) {
      switchUser(res.user.id);
      success("Đăng ký thành công!", `Chào mừng bạn gia nhập EduMind AI.`);
      onClose();
    } else {
      error("Đăng ký thất bại", res.message);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotStep === "email") {
      if (!forgotEmail.trim()) return;
      const users = storageService.getUsers();
      const u = users.find((item) => item.email.toLowerCase() === forgotEmail.trim().toLowerCase());
      if (!u) {
        error("Không tìm thấy", "Email này không tồn tại trong hệ thống.");
        return;
      }
      setForgotStep("reset");
      info("Mã xác thực đã gửi", "Đã gửi mã OTP khôi phục đến email. Nhập mật khẩu mới bên dưới.");
    } else {
      if (newPass.length < 6) {
        error("Mật khẩu yếu", "Mật khẩu phải có từ 6 ký tự.");
        return;
      }
      success("Khôi phục mật khẩu thành công!", "Bạn có thể đăng nhập bằng mật khẩu mới.");
      setTab("login");
      setForgotStep("email");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tab === "login"
          ? "Đăng Nhập EduMind AI"
          : tab === "register"
          ? "Tạo Tài Khoản Mới"
          : "Khôi Phục Mật Khẩu"
      }
      subtitle="Hệ thống Quản lý Học tập & Hỗ trợ Trí tuệ Nhân tạo LMS"
      maxWidth="480px"
    >
      {/* Tabs Switcher */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setTab("login")}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: tab === "login" ? "2px solid #4f46e5" : "2px solid transparent",
            background: "none",
            fontSize: "12.5px",
            fontWeight: tab === "login" ? 700 : 500,
            color: tab === "login" ? "#4f46e5" : "#64748b",
            cursor: "pointer",
          }}
        >
          Đăng nhập
        </button>
        <button
          onClick={() => setTab("register")}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: tab === "register" ? "2px solid #4f46e5" : "2px solid transparent",
            background: "none",
            fontSize: "12.5px",
            fontWeight: tab === "register" ? 700 : 500,
            color: tab === "register" ? "#4f46e5" : "#64748b",
            cursor: "pointer",
          }}
        >
          Đăng ký
        </button>
        <button
          onClick={() => setTab("forgot")}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: tab === "forgot" ? "2px solid #4f46e5" : "2px solid transparent",
            background: "none",
            fontSize: "12.5px",
            fontWeight: tab === "forgot" ? 700 : 500,
            color: tab === "forgot" ? "#4f46e5" : "#64748b",
            cursor: "pointer",
          }}
        >
          Quên MK
        </button>
      </div>

      {/* LOGIN TAB */}
      {tab === "login" && (
        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Email tài khoản *
            </label>
            <input
              type="email"
              required
              placeholder="Vd: minhanh.tran@student.edumind.edu.vn"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                Mật khẩu *
              </label>
              <button
                type="button"
                onClick={() => setTab("forgot")}
                style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "10.5px", cursor: "pointer", padding: 0 }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: "6px",
              padding: "10px",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            Đăng nhập
          </button>

          {/* Quick Login Test Accounts */}
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
              ⚡ ĐĂNG NHẬP NHANH VỚI TÀI KHOẢN MẪU:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleQuickLogin("student")}
                style={{
                  padding: "6px 4px",
                  borderRadius: "6px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  fontSize: "10.5px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                🎒 Học viên
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("teacher")}
                style={{
                  padding: "6px 4px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontSize: "10.5px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                🎓 Giảng viên
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                style={{
                  padding: "6px 4px",
                  borderRadius: "6px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "10.5px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                👑 Quản trị
              </button>
            </div>
          </div>
        </form>
      )}

      {/* REGISTER TAB */}
      {tab === "register" && (
        <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              Họ và tên *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Lê Tuấn Anh"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Email đăng ký *
              </label>
              <input
                type="email"
                required
                placeholder="email@edumind.edu.vn"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Vai trò
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="student">Học viên (Student)</option>
                <option value="teacher">Giảng viên (Teacher)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Số điện thoại
              </label>
              <input
                type="text"
                placeholder="09..."
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Khoa / Bộ môn
              </label>
              <input
                type="text"
                placeholder="Khoa CNTT..."
                value={regDept}
                onChange={(e) => setRegDept(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Mật khẩu (≥ 6 ký tự) *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regConfirmPass}
                onChange={(e) => setRegConfirmPass(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Đăng ký tài khoản
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD TAB */}
      {tab === "forgot" && (
        <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {forgotStep === "email" ? (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Nhập Email tài khoản cần khôi phục *
              </label>
              <input
                type="email"
                required
                placeholder="Vd: minhanh.tran@student.edumind.edu.vn"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
              <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", display: "block" }}>
                Hệ thống sẽ gửi mã xác nhận OTP về địa chỉ email này.
              </span>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Nhập Mật khẩu mới *
              </label>
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự..."
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: "9px",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {forgotStep === "email" ? "Tiếp tục gửi mã" : "Lưu mật khẩu mới"}
          </button>
        </form>
      )}
    </Modal>
  );
}
