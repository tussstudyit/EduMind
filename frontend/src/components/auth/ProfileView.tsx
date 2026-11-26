// ============================================================================
// EDUMIND AI - USER PROFILE & TEACHER STAR RATING AGGREGATION (MODULE 1 + N8N)
// Xem & sửa thông tin cá nhân, đổi mật khẩu, và hiển thị Profile Giảng viên
// do Sinh viên đánh giá (bình luận + số sao từng bình luận -> n8n tổng hợp Trung bình Sao lớn)
// ============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/services/apiClient";
import { TeacherReview, TeacherReviewSummary } from "@/types";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ProfileView() {
  const { currentUser, updateCurrentUserProfile, role } = useAuth();
  const { success, error } = useToast();

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [institution, setInstitution] = useState(currentUser.institution || currentUser.department || "");
  const [bio, setBio] = useState(currentUser.bio || "");

  // Change password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Teacher Star Rating & Reviews aggregated via n8n
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [ratingSummary, setRatingSummary] = useState<TeacherReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    badge: "Chưa có đánh giá",
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (role !== "teacher") return;
    let mounted = true;
    setIsLoadingReviews(true);
    apiClient
      .getTeacherReviews(currentUser.id)
      .then((res) => {
        if (!mounted) return;
        setReviews(res.reviews || []);
        if (res.summary) setRatingSummary(res.summary);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (mounted) setIsLoadingReviews(false);
      });
    return () => {
      mounted = false;
    };
  }, [currentUser.id, role]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Lỗi", "Họ tên không được để trống.");
      return;
    }

    updateCurrentUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      institution: institution.trim(),
      bio: bio.trim(),
    });

    success("Đã cập nhật hồ sơ cá nhân", "Thông tin mới đã được lưu thành công.");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      error("Lỗi", "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPass.length < 8) {
      error("Lỗi", "Mật khẩu mới phải từ 8 ký tự trở lên.");
      return;
    }
    if (newPass !== confirmPass) {
      error("Lỗi", "Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    try {
      await apiClient.changePassword(currentPass, newPass);
      success("Đổi mật khẩu thành công!", "Mật khẩu của bạn đã được cập nhật an toàn trên máy chủ.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      error("Đổi mật khẩu thất bại", err instanceof Error ? err.message : "Vui lòng kiểm tra lại mật khẩu hiện tại.");
    }
  };

  const renderStars = (rating: number, size = 15) => {
    const rounded = Math.round(rating);
    return (
      <span style={{ color: "#f59e0b", fontSize: `${size}px`, letterSpacing: "1px" }}>
        {"★".repeat(Math.max(0, Math.min(5, rounded)))}
        <span style={{ color: "#cbd5e1" }}>{"★".repeat(Math.max(0, 5 - rounded))}</span>
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "980px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">
            {role === "teacher"
              ? "HỒ SƠ GIẢNG VIÊN & ĐÁNH GIÁ TRUNG BÌNH SAO LỚN QUA N8N"
              : "MODULE 1: QUẢN LÝ HỒ SƠ & TÀI KHOẢN CÁ NHÂN"}
          </span>
          <h2>{role === "teacher" ? "Profile Giảng viên & Xếp hạng Đánh giá từ Sinh viên" : "Hồ Sơ Của Bạn"}</h2>
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
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
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

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
                {role === "teacher" ? "GIẢNG VIÊN" : role.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
              {currentUser.email} · {currentUser.institution || currentUser.department || "Thành viên EduMind AI"}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              Tham gia từ: {new Date(currentUser.createdAt).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>

        {role === "teacher" && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#b45309", lineHeight: 1 }}>
                {ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : "5.0"}
                <span style={{ fontSize: "14px", color: "#d97706" }}>/5</span>
              </div>
              <div>{renderStars(ratingSummary.averageRating || 5, 16)}</div>
            </div>
            <div style={{ borderLeft: "1px solid #fcd34d", paddingLeft: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#92400e" }}>
                TRUNG BÌNH SAO LỚN (N8N)
              </div>
              <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>
                {ratingSummary.totalReviews} lượt đánh giá từ Sinh viên
              </div>
              <div style={{ fontSize: "10px", color: "#047857", fontWeight: 700, marginTop: "2px" }}>
                {ratingSummary.badge}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TEACHER ONLY: N8N BIG STAR RATING AGGREGATION & STUDENT COMMENTS */}
      {role === "teacher" && (
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="panel-heading" style={{ marginBottom: 0 }}>
            <div>
              <span className="eyebrow">LUỒNG N8N TỔNG HỢP ĐÁNH GIÁ (/WEBHOOK/EDUMIND-TEACHER-RATING)</span>
              <h2>Xếp hạng Trung bình Sao lớn & Bình luận Đánh giá của Sinh viên</h2>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "99px",
                background: "#ecfdf5",
                color: "#047857",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              ⚡ Tự động tính Trung bình Sao lớn qua n8n
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              alignItems: "center",
            }}
          >
            {/* Big Star Summary Box */}
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #fde68a",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#b45309", letterSpacing: "0.04em" }}>
                ĐIỂM SAO TRUNG BÌNH LỚN
              </span>
              <div style={{ fontSize: "44px", fontWeight: 900, color: "#d97706", lineHeight: 1.05 }}>
                {ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(2) : "—"}
              </div>
              <div>{renderStars(ratingSummary.averageRating || 0, 22)}</div>
              <span style={{ fontSize: "11.5px", color: "#475569", fontWeight: 600 }}>
                Tổng hợp từ <strong>{ratingSummary.totalReviews}</strong> bình luận đánh giá
              </span>
              <span
                style={{
                  marginTop: "4px",
                  padding: "4px 10px",
                  borderRadius: "99px",
                  background: "#fffbeb",
                  color: "#b45309",
                  fontSize: "10.5px",
                  fontWeight: 700,
                }}
              >
                {ratingSummary.badge}
              </span>
            </div>

            {/* 5-star to 1-star progress bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingSummary.starCounts?.[star] || 0;
                const percent =
                  ratingSummary.totalReviews > 0
                    ? Math.round((count / ratingSummary.totalReviews) * 100)
                    : 0;
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                    <strong style={{ width: "54px", color: "#334155" }}>{star} sao ★</strong>
                    <div
                      style={{
                        flex: 1,
                        height: "9px",
                        borderRadius: "99px",
                        background: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          borderRadius: "99px",
                          background: "linear-gradient(90deg, #f59e0b, #eab308)",
                        }}
                      />
                    </div>
                    <span style={{ width: "75px", textAlign: "right", color: "#64748b", fontSize: "11px" }}>
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Student Comments & Star Ratings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <strong style={{ fontSize: "13px", color: "#1e293b" }}>
              Chi tiết Bình luận & Số sao từ Sinh viên ({reviews.length})
            </strong>
            {isLoadingReviews ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                Đang tải danh sách đánh giá...
              </div>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Chưa có bình luận đánh giá nào từ sinh viên. Khi sinh viên gửi đánh giá sao và nhận xét ở trang Khóa học hoặc Phòng học, n8n sẽ tự động tính lại Trung bình Sao lớn tại đây.
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#e0e7ff",
                          color: "#4338ca",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        {(rev.studentName || "SV").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>{rev.studentName}</strong>
                        {rev.courseTitle && (
                          <span style={{ marginLeft: "8px", fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
                            · Khóa học: {rev.courseTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {renderStars(rev.rating, 14)}
                      <strong style={{ fontSize: "12px", color: "#b45309" }}>{rev.rating}.0 / 5.0</strong>
                      <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                        {new Date(rev.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#334155", lineHeight: 1.55 }}>
                    {rev.comment || "Sinh viên đánh giá sao không kèm lời bình."}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
                  placeholder="Ví dụ: 0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Trường / Đơn vị công tác
                </label>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="Tên trường bạn đang học hoặc công tác"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Giới thiệu bản thân / Chuyên môn giảng dạy
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Chia sẻ về chuyên môn, hướng nghiên cứu..."
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
              <PasswordInput
                required
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Mật khẩu mới (≥ 8 ký tự) *
              </label>
              <PasswordInput
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
              <PasswordInput
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
