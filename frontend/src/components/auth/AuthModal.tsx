// ============================================================================
// EDUMIND AI - AUTH MODAL (LOGIN, REGISTER, FORGOT PASSWORD)
// Module 1: Đăng nhập, Đăng ký, Quên mật khẩu & Chuyển đổi tài khoản nhanh
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { UserRole } from "@/types";
import { apiClient } from "@/services/apiClient";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";

type SelfRegisterRole = Exclude<UserRole, "admin">;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register" | "forgot";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { switchRole, establishSession } = useAuth();
  const { success, error, info } = useToast();

  const [tab, setTab] = useState<"login" | "register" | "forgot">(defaultTab);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<SelfRegisterRole | "">("");
  const [regPhone, setRegPhone] = useState("");
  const [regInstitution, setRegInstitution] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [isRegPassFocused, setIsRegPassFocused] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState("");

  const passwordChecks = [
    { label: "Ít nhất 8 ký tự", passed: regPass.length >= 8 },
    { label: "Có chữ hoa và chữ thường", passed: /\p{Lu}/u.test(regPass) && /\p{Ll}/u.test(regPass) },
    { label: "Có chữ số", passed: /\p{N}/u.test(regPass) },
    { label: "Có ký tự đặc biệt", passed: /[^\p{L}\p{N}]/u.test(regPass) },
  ];
  const passwordStrength = passwordChecks.filter((check) => check.passed).length;
  const passwordStrengthLabel = !regPass
    ? "Chưa nhập mật khẩu"
    : regPass.length < 8 || passwordStrength < 2
    ? "Yếu"
    : passwordStrength === passwordChecks.length
    ? "Mạnh"
    : "Trung bình";
  const passwordStrengthColor = passwordStrengthLabel === "Mạnh"
    ? "#059669"
    : passwordStrengthLabel === "Trung bình"
    ? "#d97706"
    : "#dc2626";
  const showPasswordStrength = isRegPassFocused || Boolean(regPass);

  // Quick switch credentials
  const handleQuickLogin = (role: UserRole) => {
    if (process.env.NODE_ENV !== "development") return;
    switchRole(role);
    success(
      "Đăng nhập thành công!",
      `Đã đăng nhập với tài khoản mẫu ${role.toUpperCase()}.`
    );
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      error("Lỗi", "Vui lòng nhập email.");
      return;
    }
    try {
      const session = await apiClient.login(loginEmail.trim(), loginPass);
      establishSession(session.user, session.accessToken);
      success("Đăng nhập thành công!", `Chào mừng ${session.user.name} trở lại EduMind AI.`);
      onClose();
    } catch (err) {
      error("Đăng nhập thất bại", err instanceof Error ? err.message : "Không thể đăng nhập.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regRole) {
      error("Thiếu thông tin", "Vui lòng nhập họ tên, email hợp lệ và chọn vai trò.");
      return;
    }
    if (regPass.length < 8) {
      error("Mật khẩu yếu", "Mật khẩu phải có từ 8 ký tự trở lên.");
      return;
    }
    if (regPass !== regConfirmPass) {
      error("Mật khẩu không khớp", "Xác nhận mật khẩu không trùng khớp.");
      return;
    }

    setIsRegistering(true);
    try {
      const session = await apiClient.register({
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        password: regPass,
        phone: regPhone.trim(),
        institution: regInstitution.trim(),
      });
      establishSession(session.user, session.accessToken);
      success("Đăng ký thành công!", `Chào mừng bạn gia nhập EduMind AI.`);
      onClose();
    } catch (err) {
      error("Đăng ký thất bại", err instanceof Error ? err.message : "Không thể tạo tài khoản.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const result = await apiClient.requestPasswordReset(forgotEmail.trim());
      info("Đã tiếp nhận yêu cầu", result.message);
      setTab("login");
      setLoginEmail(forgotEmail.trim());
    } catch (err) {
      error("Không gửi được yêu cầu", err instanceof Error ? err.message : "Vui lòng thử lại sau.");
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
      subtitle="Nền tảng quản lý học tập và hỗ trợ bằng trí tuệ nhân tạo"
      maxWidth="480px"
    >
      {/* Only login and registration are exposed as tabs. Password recovery starts from the login link. */}
      {tab !== "forgot" && <div
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
      </div>}

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
              placeholder="nguyenvana@gmail.com"
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
                onClick={() => { setForgotEmail(loginEmail); setTab("forgot"); }}
                style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "10.5px", cursor: "pointer", padding: 0 }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <PasswordInput
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
          {process.env.NODE_ENV === "development" && <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
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
          </div>}
        </form>
      )}

      {/* REGISTER TAB */}
      {tab === "register" && (
        <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label htmlFor="register-name" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Họ và tên *
            </label>
            <input
              id="register-name"
              type="text"
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              placeholder="VD: Nguyễn Minh Anh"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="register-email" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Email đăng nhập *
              </label>
              <input
                id="register-email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                placeholder="nguyenvana@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
              <span style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "10px", lineHeight: 1.4 }}>
                Dùng email bạn còn truy cập được.
              </span>
            </div>
            <div>
              <label htmlFor="register-role" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Vai trò *
              </label>
              <select
                id="register-role"
                required
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as SelfRegisterRole | "")}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: regRole ? "#1e293b" : "#64748b", fontSize: "12px" }}
              >
                <option value="" disabled>Chọn vai trò</option>
                <option value="student">Sinh viên</option>
                <option value="teacher">Giảng viên</option>
              </select>
              <span style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "10px", lineHeight: 1.4 }}>
                {regRole === "teacher"
                  ? "Dành cho người dạy và quản lý khóa học."
                  : regRole === "student"
                  ? "Dành cho người học và theo dõi tiến độ."
                  : "Chọn vai trò phù hợp với bạn."}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="register-phone" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Số điện thoại
              </label>
              <input
                id="register-phone"
                type="tel"
                maxLength={32}
                autoComplete="tel"
                placeholder="VD: 0912 345 678"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
              <span style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "10px" }}>
                Không bắt buộc.
              </span>
            </div>
            <div>
              <label htmlFor="register-institution" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Trường
              </label>
              <input
                id="register-institution"
                type="text"
                maxLength={160}
                autoComplete="organization"
                placeholder="VD: Trường Đại học Bách khoa Hà Nội"
                value={regInstitution}
                onChange={(e) => setRegInstitution(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
              <span style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "10px", lineHeight: 1.4 }}>
                Nhập tên trường bạn đang học hoặc công tác.
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="register-password" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mật khẩu *
              </label>
              <PasswordInput
                id="register-password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                aria-describedby={showPasswordStrength ? "register-password-help register-password-strength" : "register-password-help"}
                placeholder="Tạo mật khẩu"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                onFocus={() => setIsRegPassFocused(true)}
                onBlur={() => setIsRegPassFocused(false)}
                style={{ width: "100%", minWidth: 0, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "12px" }}
              />
            </div>
            <div>
              <label htmlFor="register-confirm-password" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Xác nhận mật khẩu *
              </label>
              <PasswordInput
                id="register-confirm-password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={regConfirmPass}
                onChange={(e) => setRegConfirmPass(e.target.value)}
                style={{ width: "100%", minWidth: 0, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "12px" }}
              />
              {regConfirmPass && (
                <span style={{ display: "block", marginTop: "4px", color: regPass === regConfirmPass ? "#059669" : "#dc2626", fontSize: "10px" }}>
                  {regPass === regConfirmPass ? "Mật khẩu trùng khớp." : "Mật khẩu chưa trùng khớp."}
                </span>
              )}
            </div>
          </div>

          <div id="register-password-help" style={{ color: "#64748b", fontSize: "10px", lineHeight: 1.45 }}>
            Dùng ít nhất 8 ký tự; kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt để tăng độ an toàn.
            {showPasswordStrength && (
              <div id="register-password-strength" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <div aria-hidden="true" style={{ display: "flex", flex: 1, gap: "4px" }}>
                  {passwordChecks.map((check, index) => (
                    <span key={check.label} style={{ height: "4px", flex: 1, borderRadius: "999px", background: index < passwordStrength ? passwordStrengthColor : "#e2e8f0" }} />
                  ))}
                </div>
                <strong style={{ color: regPass ? passwordStrengthColor : "#64748b", fontSize: "10px", whiteSpace: "nowrap" }}>
                  Độ mạnh: {passwordStrengthLabel}
                </strong>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            style={{
              marginTop: "2px",
              padding: "10px",
              borderRadius: "8px",
              background: isRegistering ? "#818cf8" : "#4f46e5",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: isRegistering ? "wait" : "pointer",
            }}
          >
            {isRegistering ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>
      )}

      {/* PASSWORD RECOVERY FORM */}
      {tab === "forgot" && (
        <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Email tài khoản cần khôi phục *
            </label>
            <input
              type="email"
              required
              placeholder="nguyenvana@gmail.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
            <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Yêu cầu sẽ được chuyển đến quản trị viên. Nếu thông tin hợp lệ, Admin sẽ gửi liên kết khôi phục qua email.
            </span>
          </div>

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
            Gửi yêu cầu khôi phục
          </button>
          <button type="button" onClick={() => setTab("login")} style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "11px", cursor: "pointer" }}>
            Quay lại đăng nhập
          </button>
        </form>
      )}
    </Modal>
  );
}
