"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/services/apiClient";
import { PasswordInput } from "@/components/ui/PasswordInput";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = [
    { label: "Ít nhất 8 ký tự", passed: password.length >= 8 },
    { label: "Có chữ hoa và chữ thường", passed: /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) },
    { label: "Có chữ số", passed: /\p{N}/u.test(password) },
    { label: "Có ký tự đặc biệt", passed: /[^\p{L}\p{N}]/u.test(password) },
  ];
  const passwordStrength = passwordChecks.filter((check) => check.passed).length;
  const passwordStrengthLabel = !password
    ? "Chưa nhập mật khẩu"
    : password.length < 8 || passwordStrength < 2
    ? "Yếu"
    : passwordStrength === passwordChecks.length
    ? "Mạnh"
    : "Trung bình";
  const passwordStrengthColor = passwordStrengthLabel === "Mạnh"
    ? "#059669"
    : passwordStrengthLabel === "Trung bình"
    ? "#d97706"
    : "#dc2626";
  const showPasswordStrength = isPasswordFocused || Boolean(password);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Hai mật khẩu chưa khớp nhau.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.completePasswordReset(token, password);
      setIsComplete(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Liên kết không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8fafc" }}>
      <section style={{ width: "100%", maxWidth: "420px", padding: "28px", borderRadius: "16px", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}>
        <p style={{ margin: "0 0 6px", color: "#4f46e5", fontWeight: 700, fontSize: "12px" }}>EduMind AI</p>
        <h1 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: "22px" }}>{isComplete ? "Đã đổi mật khẩu" : "Đặt lại mật khẩu"}</h1>
        {isComplete ? (
          <>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>Mật khẩu mới đã được lưu. Bạn có thể quay lại EduMind AI và đăng nhập.</p>
            <Link href="/" style={{ display: "inline-block", marginTop: "10px", padding: "10px 14px", borderRadius: "8px", background: "#4f46e5", color: "#fff", textDecoration: "none", fontWeight: 650, fontSize: "13px" }}>Về trang đăng nhập</Link>
          </>
        ) : !token ? (
          <>
            <p style={{ color: "#b91c1c", fontSize: "13px", lineHeight: 1.6 }}>Liên kết thiếu mã khôi phục. Hãy yêu cầu Admin gửi lại email.</p>
            <Link href="/" style={{ color: "#4f46e5", fontSize: "13px" }}>Quay về EduMind AI</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
            <label htmlFor="reset-password" style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#475569", fontSize: "12px", fontWeight: 650 }}>
              Mật khẩu mới
              <PasswordInput
                id="reset-password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                aria-describedby={showPasswordStrength ? "reset-password-help reset-password-strength" : "reset-password-help"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
              />
            </label>
            <div id="reset-password-help" style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}>
              Dùng ít nhất 8 ký tự; nên kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
              {showPasswordStrength && (
                <div id="reset-password-strength" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "7px" }}>
                  <div aria-hidden="true" style={{ display: "flex", flex: 1, gap: "4px" }}>
                    {passwordChecks.map((check, index) => (
                      <span key={check.label} style={{ height: "5px", flex: 1, borderRadius: "999px", background: index < passwordStrength ? passwordStrengthColor : "#e2e8f0" }} />
                    ))}
                  </div>
                  <strong style={{ color: password ? passwordStrengthColor : "#64748b", fontSize: "11px", whiteSpace: "nowrap" }}>
                    Độ mạnh: {passwordStrengthLabel}
                  </strong>
                </div>
              )}
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#475569", fontSize: "12px", fontWeight: 650 }}>
              Nhập lại mật khẩu mới
              <PasswordInput required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }} />
            </label>
            {message && <p role="alert" style={{ margin: 0, color: "#b91c1c", fontSize: "12px" }}>{message}</p>}
            <button type="submit" disabled={isSubmitting} style={{ padding: "11px", border: "none", borderRadius: "8px", background: isSubmitting ? "#94a3b8" : "#4f46e5", color: "#fff", fontWeight: 700, cursor: isSubmitting ? "wait" : "pointer" }}>
              {isSubmitting ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#64748b" }}>Đang mở liên kết khôi phục...</main>}><ResetPasswordForm /></Suspense>;
}
