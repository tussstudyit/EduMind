// ============================================================================
// EDUMIND AI - ADMIN DASHBOARD COMPONENT (MODULE 13 - LIVE POSTGRESQL DATA)
// Báo cáo tổng quan thời gian thực từ PostgreSQL: học viên, khóa học, lượt thi, AI/OCR & Audit Log
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { AIConfig, SystemLog } from "@/types";
import { apiClient, AdminReportSummary } from "@/services/apiClient";
import { initialAIConfig } from "@/mock/initialData";
import { Icon } from "@/components/ui/Icons";

interface AdminDashboardProps {
  onNavigate: (viewId: string) => void;
}

const emptySummary: AdminReportSummary = {
  users: 0,
  teachers: 0,
  students: 0,
  courses: 0,
  publishedCourses: 0,
  activeEnrollments: 0,
  quizzes: 0,
  attempts: 0,
  submittedAttempts: 0,
  ocrScans: 0,
  aiTutorReplies: 0,
  recommendationsCount: 0,
  passRatePercent: 0,
  weeklyExamActivity: [
    { day: "T2", attempts: 0, rate: 0 },
    { day: "T3", attempts: 0, rate: 0 },
    { day: "T4", attempts: 0, rate: 0 },
    { day: "T5", attempts: 0, rate: 0 },
    { day: "T6", attempts: 0, rate: 0 },
    { day: "T7", attempts: 0, rate: 0 },
    { day: "CN", attempts: 0, rate: 0 },
  ],
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [summary, setSummary] = useState<AdminReportSummary>(emptySummary);
  const [aiConfig, setAiConfig] = useState<AIConfig>(initialAIConfig);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.getAdminReportSummary().catch(() => emptySummary),
      apiClient.getAiConfig().catch(() => initialAIConfig),
      apiClient.getSystemLogs(5).catch(() => []),
    ]).then(([report, cfg, recentLogs]) => {
      if (!mounted) return;
      setSummary(report);
      setAiConfig(cfg);
      setLogs(recentLogs.slice(0, 5));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const weeklyExamActivity = summary.weeklyExamActivity?.length
    ? summary.weeklyExamActivity
    : emptySummary.weeklyExamActivity;
  const maxAttempts = Math.max(...weeklyExamActivity.map((d) => d.attempts), 1);
  const weeklyTotalAttempts = weeklyExamActivity.reduce((sum, d) => sum + d.attempts, 0);

  const totalAiInteractions =
    (summary.aiTutorReplies || 0) + (summary.ocrScans || 0) + (summary.recommendationsCount || 0);
  const denom = Math.max(totalAiInteractions, 1);
  const tutorPct = totalAiInteractions > 0 ? Math.round(((summary.aiTutorReplies || 0) / denom) * 100) : 0;
  const ocrPct = totalAiInteractions > 0 ? Math.round(((summary.ocrScans || 0) / denom) * 100) : 0;
  const recPct = totalAiInteractions > 0 ? Math.max(0, 100 - tutorPct - ocrPct) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title Header */}
      <div className="welcome-row">
        <div>
          <span className="welcome-kicker">TRUNG TÂM ĐIỀU HÀNH & BÁO CÁO HỆ THỐNG</span>
          <h1>Bảng Điều Khiển Quản Trị Viên</h1>
          <p>Giám sát toàn bộ hoạt động đào tạo, người dùng, hiệu năng thi cử và tình trạng dịch vụ AI.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onNavigate("admin_users")}
            className="quick-action"
            style={{ cursor: "pointer", border: "1px solid #c7d2fe" }}
          >
            <Icon name="users" size={14} /> Quản lý Người dùng
          </button>
          <button
            onClick={() => onNavigate("admin_system")}
            className="quick-action"
            style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
          >
            <Icon name="settings" size={14} /> Cấu hình AI & Nhật ký
          </button>
        </div>
      </div>

      {/* 4 Stat Cards: Học viên, Khóa học, Lượt làm bài, Lượt dùng AI/OCR */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-purple">
            <Icon name="users" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Số lượng học viên</span>
            <strong className="stat-value">{summary.students}</strong>
            <span className="stat-detail">
              Tổng hệ thống: {summary.users} tài khoản ({summary.teachers} giảng viên)
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-blue">
            <Icon name="book" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Số lượng khóa học</span>
            <strong className="stat-value">{summary.courses}</strong>
            <span className="stat-detail">
              {summary.publishedCourses} đã xuất bản · {summary.activeEnrollments} lượt ghi danh
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-green">
            <Icon name="award" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lượt làm bài kiểm tra</span>
            <strong className="stat-value">{summary.attempts}</strong>
            <span className="stat-detail">
              {summary.submittedAttempts} đã nộp · {summary.quizzes} đề kiểm tra
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-orange">
            <Icon name="sparkles" size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lượt dùng AI & Quét OCR</span>
            <strong className="stat-value">{totalAiInteractions}</strong>
            <span className="stat-detail">{aiConfig.provider.toUpperCase()} Vision + Chatbot</span>
          </div>
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        {/* Chart 1: Lượt làm bài & Nộp bài theo tuần */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="panel-heading" style={{ marginBottom: "4px" }}>
            <div>
              <span className="eyebrow">BIỂU ĐỒ HOẠT ĐỘNG KIỂM TRA</span>
              <h2>Lượt nộp bài đánh giá trong 7 ngày qua</h2>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Dữ liệu trực tiếp từ hệ thống</span>
          </div>

          {/* Bar Chart Visualization */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              height: "180px",
              padding: "16px 10px 0",
              borderBottom: "1px solid #e2e8f0",
              gap: "12px",
            }}
          >
            {weeklyExamActivity.map((item, idx) => {
              const heightPercent = item.attempts > 0 ? Math.max(12, Math.round((item.attempts / maxAttempts) * 100)) : 4;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#4f46e5" }}>
                    {item.attempts}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "34px",
                      height: `${heightPercent}%`,
                      background: idx === weeklyExamActivity.length - 1 ? "#4f46e5" : "linear-gradient(180deg, #818cf8 0%, #c7d2fe 100%)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.4s ease",
                    }}
                    title={`${item.day}: ${item.attempts} lượt thi (${item.rate}% đạt điểm chuẩn)`}
                  />
                  <span style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#64748b" }}>
            <span>✦ Tổng lượt thi 7 ngày qua: <strong>{weeklyTotalAttempts} lượt</strong></span>
            <span>✦ Tỉ lệ đạt chuẩn trung bình: <strong style={{ color: "#06b6d4" }}>{summary.passRatePercent}%</strong></span>
          </div>
        </div>

        {/* Chart 2: Tỉ lệ tài nguyên sử dụng AI & OCR */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="panel-heading" style={{ marginBottom: "4px" }}>
            <div>
              <span className="eyebrow">TÀI NGUYÊN HỆ THỐNG AI</span>
              <h2>Phân bổ tải AI & OCR</h2>
            </div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "10px",
                background: "#cffafe",
                color: "#0e7490",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              ● {aiConfig.serviceStatus === "healthy" ? "Sẵn sàng" : aiConfig.serviceStatus.toUpperCase()}
            </span>
          </div>

          {/* Breakdown bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>1. AI Tutor Q&A Chatbot ({aiConfig.modelName})</span>
                <strong style={{ color: "#4f46e5" }}>{tutorPct}% ({summary.aiTutorReplies || 0} phản hồi)</strong>
              </div>
              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: `${tutorPct}%`, height: "100%", background: "#4f46e5", borderRadius: "10px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>2. OCR Vision Worker ({aiConfig.ocrEngine})</span>
                <strong style={{ color: "#06b6d4" }}>{ocrPct}% ({summary.ocrScans || 0} bản quét)</strong>
              </div>
              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: `${ocrPct}%`, height: "100%", background: "#06b6d4", borderRadius: "10px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>3. Adaptive Recommendations Engine</span>
                <strong style={{ color: "#d97706" }}>{recPct}% ({summary.recommendationsCount || 0} đề xuất)</strong>
              </div>
              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: `${recPct}%`, height: "100%", background: "#f59e0b", borderRadius: "10px" }} />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              color: "#64748b",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            <span>Model: <strong>{aiConfig.modelName}</strong></span>
            <span>Giới hạn ngày: <strong>{aiConfig.dailyUsageCount} / {aiConfig.dailyUsageLimit}</strong></span>
          </div>
        </div>
      </div>

      {/* Fast Shortcuts & Activity Log Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        {/* Quick Management Cards */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <span className="eyebrow">CHỨC NĂNG QUẢN TRỊ VIÊN</span>
              <h2>Quản lý nghiệp vụ trọng tâm</h2>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <div
              onClick={() => onNavigate("admin_users")}
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4f46e5" }}>
                <Icon name="users" size={18} />
                <strong style={{ fontSize: "13px" }}>Tài khoản & Phân quyền</strong>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                Cấp vai trò Admin, Teacher, Student và khóa tài khoản khi có vi phạm.
              </p>
            </div>

            <div
              onClick={() => onNavigate("admin_subjects")}
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#06b6d4" }}>
                <Icon name="book" size={18} />
                <strong style={{ fontSize: "13px" }}>Môn học & Chủ đề</strong>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                Thêm môn học mới, thiết lập cây chủ đề và kiểm soát trạng thái ẩn/hiện.
              </p>
            </div>

            <div
              onClick={() => onNavigate("admin_courses")}
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d97706" }}>
                <Icon name="fileText" size={18} />
                <strong style={{ fontSize: "13px" }}>Khóa học toàn trường</strong>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                Xem danh sách tất cả khóa học của các giảng viên, xuất bản hoặc lưu trữ.
              </p>
            </div>

            <div
              onClick={() => onNavigate("admin_system")}
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b5cf6" }}>
                <Icon name="settings" size={18} />
                <strong style={{ fontSize: "13px" }}>Cấu hình AI & Nhật ký</strong>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                Chỉnh sửa Model LLM, Temperature, ngưỡng OCR và xem Audit Log chỉ đọc.
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time System Log Snippet (Read-Only) */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <span className="eyebrow">NHẬT KÝ HỆ THỐNG GẦN ĐÂY</span>
              <h2>Audit Trail (Chỉ đọc)</h2>
            </div>
            <button
              onClick={() => onNavigate("admin_system")}
              className="text-link"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Xem tất cả →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {logs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                Chưa có nhật ký hệ thống nào được ghi nhận.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#1e293b" }}>{log.action}</strong>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                      {new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                    {log.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
