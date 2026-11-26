// ============================================================================
// EDUMIND AI - STUDENT RECOMMENDATIONS COMPONENT (MODULE 11)
// Đề xuất học tập cá nhân hóa tự động: Phân tích tiến độ khóa học, điểm số
// bài kiểm tra, lịch sử hỏi đáp AI Tutor & Quét OCR để tự sinh gợi ý mới.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Recommendation } from "@/types";
import { storageService } from "@/services/storageService";
import { apiClient } from "@/services/apiClient";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModel, setActiveModel] = useState("gemini-3.8-flash");

  const loadRecommendations = useCallback(async () => {
    try {
      const [remoteList, runtime] = await Promise.all([
        apiClient.getRecommendations(false),
        apiClient.getAiRuntimeStatus().catch(() => null),
      ]);
      if (runtime?.modelName) setActiveModel(runtime.modelName);
      setRecommendations(remoteList);
    } catch {
      const cfg = storageService.getAIConfig();
      setActiveModel(cfg.modelName || "gemini-3.8-flash");
      const list = storageService.getRecommendations(currentUser.id);
      setRecommendations(list);
    }
  }, [currentUser.id]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const handleMarkAsRead = async (recId: string) => {
    storageService.markRecommendationRead(recId);
    try {
      await apiClient.markRecommendationRead(recId);
    } catch {
      // Fallback handled by storageService
    }
    setRecommendations((prev) => prev.map((r) => (r.id === recId ? { ...r, isRead: true } : r)));
    success("Đã đánh dấu đã xem", "Gợi ý này đã được chuyển vào mục đã đọc.");
  };

  const handleDismiss = async (recId: string) => {
    storageService.dismissRecommendation(recId);
    try {
      await apiClient.dismissRecommendation(recId);
    } catch {
      // Fallback handled by storageService
    }
    setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    info("Đã bỏ qua gợi ý", "Đề xuất đã được ẩn khỏi danh sách của bạn.");
  };

  const handleAction = (rec: Recommendation) => {
    void handleMarkAsRead(rec.id);

    if (rec.type === "exercise") {
      onNavigate("student_quiz");
    } else if (rec.courseId && onOpenCourse && rec.type === "review") {
      onOpenCourse(rec.courseId);
    } else if (rec.type === "course") {
      onNavigate("student_courses");
    } else if (rec.type === "tip") {
      onNavigate("student_tutor");
    } else {
      onNavigate("student_learn");
    }
  };

  const handleGeneratePersonalized = async () => {
    setIsGenerating(true);
    try {
      const generated = await apiClient.generateRecommendations();
      setRecommendations(generated);
      setFilterTab("all");
      success(
        "Đã phân tích & sinh lộ trình cá nhân hóa mới!",
        `Engine AI (${activeModel}) đã tổng hợp tiến độ bài học, điểm bài thi và lịch sử AI Tutor của bạn.`,
      );
    } catch {
      const generated = storageService.generatePersonalizedRecommendations(currentUser.id);
      setRecommendations(generated);
      setFilterTab("all");
      success(
        "Đã tự sinh đề xuất cá nhân hóa mới!",
        `Đã phân tích tiến độ khóa học, lịch sử kiểm tra và hội thoại AI Tutor của bạn.`,
      );
    } finally {
      setIsGenerating(false);
    }
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
          <span className="eyebrow">MODULE 11: ĐỀ XUẤT HỌC TẬP THÔNG MINH (AI ADAPTIVE ENGINE)</span>
          <h2>Lộ trình & Gợi ý Bài học Cá nhân hóa</h2>
        </div>
        <button
          onClick={() => void handleGeneratePersonalized()}
          disabled={isGenerating}
          className="quick-action"
          style={{
            cursor: isGenerating ? "wait" : "pointer",
            background: "#4f46e5",
            color: "#ffffff",
            borderColor: "#4f46e5",
          }}
        >
          <Icon name="sparkles" size={13} />{" "}
          {isGenerating ? "AI đang phân tích hồ sơ..." : "Phân tích & Sinh gợi ý AI mới"}
        </button>
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
              EduMind Adaptive Learning Engine · Model: {activeModel}
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              Thuật toán tự động tổng hợp tiến độ từng bài học, kết quả chấm điểm Quiz, lịch sử hỏi đáp AI Tutor và bản quét OCR để sinh đề xuất cá nhân hóa cho riêng bạn.
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
            onClick={() => setFilterTab(tab.id as typeof filterTab)}
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
            padding: "56px 24px",
            textAlign: "center",
            background: "linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%)",
            borderRadius: "16px",
            border: "2px dashed #c7d2fe",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
              display: "grid",
              placeItems: "center",
              color: "#6366f1",
            }}
          >
            <Icon name="sparkles" size={28} />
          </div>
          <div>
            <strong style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>
              {filterTab === "unread"
                ? "Bạn đã xem hết tất cả gợi ý!"
                : filterTab === "read"
                ? "Chưa có gợi ý nào được đánh dấu đã xem"
                : "Không có đề xuất nào trong mục này"}
            </strong>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 0", maxWidth: "380px", lineHeight: "1.6" }}>
              {filterTab === "unread"
                ? "Tuyệt vời! Hãy bấm nút bên dưới để AI phân tích tiến độ mới nhất và tạo thêm gợi ý phù hợp với bạn."
                : filterTab === "read"
                ? 'Hãy tương tác với các gợi ý học tập, nhấn "Đã xem" để chúng xuất hiện ở đây.'
                : "Bấm nút bên dưới để AI phân tích tiến độ khóa học, điểm thi và lịch sử học tập của bạn."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => void handleGeneratePersonalized()}
              disabled={isGenerating}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: isGenerating ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Icon name="refresh" size={14} />{" "}
              {isGenerating ? "Đang phân tích..." : "Tạo lại gợi ý mới"}
            </button>
            {filterTab !== "all" && (
              <button
                onClick={() => setFilterTab("all")}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#4f46e5",
                  border: "1.5px solid #c7d2fe",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xem tất cả đề xuất
              </button>
            )}
          </div>
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
                          : rec.type === "exercise"
                          ? "#fef3c7"
                          : rec.type === "tip"
                          ? "#cffafe"
                          : "#ecfdf5",
                      color:
                        rec.type === "course"
                          ? "#6366f1"
                          : rec.type === "exercise"
                          ? "#b45309"
                          : rec.type === "tip"
                          ? "#0e7490"
                          : "#047857",
                    }}
                  >
                    {rec.type === "course"
                      ? "KHÓA HỌC BỔ TRỢ"
                      : rec.type === "exercise"
                      ? "BÀI TẬP ÔN LUYỆN"
                      : rec.type === "tip"
                      ? "GỢI Ý TỪ AI TUTOR / OCR"
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
                      onClick={() => void handleMarkAsRead(rec.id)}
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
                    onClick={() => void handleDismiss(rec.id)}
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
