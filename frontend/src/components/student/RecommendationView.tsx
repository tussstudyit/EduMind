// ============================================================================
// EDUMIND AI - STUDENT RECOMMENDATIONS COMPONENT (MODULE 11)
// Đề xuất học tập thông minh: Thẻ gợi ý bài học / khóa học, nút Xem ngay,
// Đánh dấu đã xem & Bỏ qua
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Recommendation } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";

interface RecommendationViewProps {
  onNavigate: (viewId: string) => void;
  onOpenCourse?: (courseId: string) => void;
}

export function RecommendationView({ onNavigate, onOpenCourse }: RecommendationViewProps) {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");

  const loadRecommendations = () => {
    const list = storageService.getRecommendations(currentUser.id);
    setRecommendations(list);
  };

  useEffect(() => {
    loadRecommendations();
  }, [currentUser.id]);

  const handleMarkAsRead = (recId: string) => {
    storageService.markRecommendationRead(recId);
    success("Đã đánh dấu đã xem", "Gợi ý này đã được chuyển vào mục đã đọc.");
    loadRecommendations();
  };

  const handleDismiss = (recId: string) => {
    storageService.dismissRecommendation(recId);
    info("Đã bỏ qua gợi ý", "Đề xuất đã được ẩn khỏi danh sách của bạn.");
    loadRecommendations();
  };

  const handleAction = (rec: Recommendation) => {
    storageService.markRecommendationRead(rec.id);

    if (rec.type === "quiz") {
      onNavigate("student_quiz");
    } else if (rec.type === "course") {
      onNavigate("student_courses");
    } else {
      onNavigate("student_learn");
    }
  };

  const handleResetRecommendations = () => {
    // Khôi phục gợi ý mẫu nếu người dùng đã bấm bỏ qua hết
    localStorage.removeItem("edumind_recommendations");
    loadRecommendations();
    success("Đã đặt lại dữ liệu đề xuất AI!");
  };

  const filtered = recommendations.filter((r) => {
    if (filterTab === "unread") return !r.isRead;
    if (filterTab === "read") return r.isRead;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 11: ĐỀ XUẤT HỌC TẬP THÔNG MINH (AI RECOMMENDATIONS)</span>
          <h2>Lộ trình & Gợi ý Bài học Cá nhân hóa</h2>
        </div>
        {recommendations.length < 2 && (
          <button
            onClick={handleResetRecommendations}
            className="quick-action"
            style={{ cursor: "pointer", background: "#f8fafc" }}
          >
            <Icon name="refresh" size={13} /> Khôi phục gợi ý mẫu
          </button>
        )}
      </div>

      {/* AI Engine Banner */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
          border: "1px solid #dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#4f46e5",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 4px 10px rgba(79, 70, 229, 0.25)",
            }}
          >
            <Icon name="sparkles" size={20} />
          </div>
          <div>
            <strong style={{ fontSize: "14px", color: "#1e293b", display: "block" }}>
              EduMind Adaptive Learning Engine
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              Thuật toán liên tục phân tích tiến độ, điểm số bài kiểm tra và lịch sử xem bài giảng để đề xuất nội dung tối ưu nhất cho bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { id: "all", label: `Tất cả đề xuất (${recommendations.length})` },
          { id: "unread", label: `Chưa xem (${recommendations.filter((r) => !r.isRead).length})` },
          { id: "read", label: `Đã xem (${recommendations.filter((r) => r.isRead).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              border: filterTab === tab.id ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
              background: filterTab === tab.id ? "#e0e7ff" : "#ffffff",
              color: filterTab === tab.id ? "#3730a3" : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ color: "#94a3b8", marginBottom: "10px" }}>
            <Icon name="sparkles" size={32} />
          </div>
          <strong style={{ fontSize: "14px", color: "#1e293b", display: "block" }}>
            Không có đề xuất nào trong mục này.
          </strong>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 16px" }}>
            Bạn đã hoàn thành xem hoặc bỏ qua các gợi ý học tập trước đó.
          </p>
          <button
            onClick={handleResetRecommendations}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tạo lại gợi ý mới
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {filtered.map((rec) => (
            <div
              key={rec.id}
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: rec.isRead ? "1px solid #e2e8f0" : "1.5px solid #c7d2fe",
                boxShadow: rec.isRead ? "0 2px 6px rgba(0,0,0,0.02)" : "0 6px 16px rgba(99, 102, 241, 0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                position: "relative",
              }}
            >
              <div>
                {/* Type and Status row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "9.5px",
                      fontWeight: 800,
                      background:
                        rec.type === "course"
                          ? "#ede9fe"
                          : rec.type === "quiz"
                          ? "#fef3c7"
                          : "#ecfdf5",
                      color:
                        rec.type === "course"
                          ? "#6366f1"
                          : rec.type === "quiz"
                          ? "#b45309"
                          : "#047857",
                    }}
                  >
                    {rec.type === "course"
                      ? "KHÓA HỌC BỔ TRỢ"
                      : rec.type === "quiz"
                      ? "BÀI TẬP ÔN LUYỆN"
                      : "BÀI GIẢNG TIẾP THEO"}
                  </span>

                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 700,
                      background: rec.isRead ? "#f1f5f9" : "#eff6ff",
                      color: rec.isRead ? "#94a3b8" : "#2563eb",
                    }}
                  >
                    {rec.isRead ? "ĐÃ XEM" : "● GỢI Ý MỚI"}
                  </span>
                </div>

                {/* Reason tag */}
                <div style={{ fontSize: "10.5px", color: "#6366f1", fontWeight: 700, marginBottom: "6px" }}>
                  ✦ {rec.reason || "Dựa trên tiến độ và kết quả làm bài của bạn"}
                </div>

                <h3 style={{ margin: "0 0 6px", fontSize: "15px", color: "#1e293b", fontWeight: 700, lineHeight: "1.4" }}>
                  {rec.title}
                </h3>

                <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.55" }}>
                  {rec.description}
                </p>
              </div>

              {/* 3 Explicit Action Buttons: Xem ngay, Đánh dấu đã xem, Bỏ qua */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  gap: "6px",
                }}
              >
                <button
                  onClick={() => handleAction(rec)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "7px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Icon name="play" size={12} /> Xem ngay
                </button>

                <div style={{ display: "flex", gap: "6px" }}>
                  {!rec.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(rec.id)}
                      title="Đánh dấu đã xem gợi ý này"
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Icon name="check" size={12} /> Đã xem
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(rec.id)}
                    title="Bỏ qua gợi ý này"
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
