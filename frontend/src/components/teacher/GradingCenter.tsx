// ============================================================================
// EDUMIND AI - GRADING CENTER COMPONENT (MODULE 7 - LIVE POSTGRESQL DATA)
// Giảng viên xem danh sách bài nộp, xem trực tiếp file bài làm tự luận của
// sinh viên ngay tại Web, chấm điểm & gửi kết quả/nhận xét về cho sinh viên
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { QuizAttempt, Question } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import type { UploadedAttachmentPayload } from "@/services/questionImportService";

export function GradingCenter() {
  const { success, error } = useToast();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Grading form state
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [essayFeedbacks, setEssayFeedbacks] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [fullscreenAttachment, setFullscreenAttachment] = useState<{
    title: string;
    payload: UploadedAttachmentPayload;
  } | null>(null);

  const loadAttempts = async () => {
    setIsLoading(true);
    try {
      setAttempts(await apiClient.getAttempts());
    } catch (err) {
      error("Không tải được danh sách bài nộp", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAttempts();
  }, []);

  const handleOpenGradeModal = async (att: QuizAttempt) => {
    setSelectedAttempt(att);
    try {
      const qList = await apiClient.getQuestions(att.quizId, false);
      setQuestions(qList);
    } catch {
      setQuestions([]);
    }

    const initialScores: Record<string, number> = {};
    const initialFb: Record<string, string> = {};

    att.answers.forEach((ans) => {
      if (ans.scoreAwarded !== undefined) {
        initialScores[ans.questionId] = Number(ans.scoreAwarded);
      }
      if (ans.teacherFeedback) {
        initialFb[ans.questionId] = ans.teacherFeedback;
      }
    });

    setEssayScores(initialScores);
    setEssayFeedbacks(initialFb);
    setGeneralNotes(att.teacherNotes || "");
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    const essayQuestions = questions.filter((q) => q.type === "essay");
    const gradesPayload = essayQuestions.map((q) => ({
      questionId: q.id,
      scoreAwarded: Number(essayScores[q.id] ?? 0),
      teacherFeedback: essayFeedbacks[q.id] || "",
    }));

    try {
      const updated = await apiClient.gradeAttempt(selectedAttempt.id, gradesPayload, generalNotes);
      success(
        "Đã chấm điểm & gửi kết quả về Sinh viên!",
        `Bài làm của ${updated.studentName} đã được cập nhật: ${updated.totalScore}/${updated.maxScore} điểm.`,
      );
      setSelectedAttempt(null);
      await loadAttempts();
    } catch (err) {
      error("Không lưu được điểm chấm", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const filtered = attempts.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const liveTotalPreview = questions.reduce((sum, q) => {
    if (q.type === "essay") {
      return sum + Number(essayScores[q.id] ?? 0);
    }
    const ans = selectedAttempt?.answers.find((a) => a.questionId === q.id);
    return sum + Number(ans?.scoreAwarded ?? 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 7: BÀI LÀM VÀ CHẤM ĐIỂM (TEACHER)</span>
          <h2>Trung tâm Đánh giá &amp; Chấm điểm Trực tuyến</h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "all", label: `Tất cả bài làm (${attempts.length})` },
          {
            id: "submitted",
            label: `Cần chấm tự luận (${attempts.filter((a) => a.status === "submitted").length})`,
          },
          {
            id: "graded",
            label: `Đã chấm xong (${attempts.filter((a) => a.status === "graded").length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              border: filterStatus === tab.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
              background: filterStatus === tab.id ? "#e0e7ff" : "#ffffff",
              color: filterStatus === tab.id ? "#3730a3" : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table of submissions */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Học viên</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Bài kiểm tra</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tệp bài làm</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Thời gian nộp</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tổng điểm</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải danh sách bài nộp...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có bài làm nào của học viên trong mục này.
                </td>
              </tr>
            ) : (
              filtered.map((att) => {
                const uploadedFilesCount = att.answers.filter((a) => a.attachmentName).length;
                return (
                  <tr key={att.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#eef2ff",
                            color: "#4338ca",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          {att.studentAvatar || "HV"}
                        </div>
                        <div>
                          <strong style={{ color: "#1e293b", display: "block" }}>{att.studentName}</strong>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>ID: {att.studentId}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600 }}>{att.quizTitle}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {uploadedFilesCount > 0 ? (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "#eef2ff",
                            color: "#4338ca",
                            fontSize: "10.5px",
                            fontWeight: 700,
                          }}
                        >
                          📎 {uploadedFilesCount} file đính kèm
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>Trực tiếp trên web</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString("vi-VN") : "Đang làm bài"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background:
                            att.status === "graded"
                              ? "#ecfdf5"
                              : att.status === "submitted"
                              ? "#fffbeb"
                              : "#f1f5f9",
                          color:
                            att.status === "graded"
                              ? "#065f46"
                              : att.status === "submitted"
                              ? "#b45309"
                              : "#475569",
                        }}
                      >
                        {att.status === "graded"
                          ? "Đã chấm & Gửi SV"
                          : att.status === "submitted"
                          ? "Chờ chấm tự luận"
                          : "Đang làm"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ fontSize: "14px", color: "#4f46e5" }}>{att.totalScore}</strong>{" "}
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>/ {att.maxScore}đ</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => void handleOpenGradeModal(att)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: att.status === "submitted" ? "#4f46e5" : "#f1f5f9",
                          color: att.status === "submitted" ? "#ffffff" : "#334155",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {att.status === "submitted" ? "👁️ Xem bài & Chấm điểm" : "Xem / Sửa điểm"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Chấm điểm & Xem bài trực tiếp ngay tại Web */}
      <Modal
        isOpen={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        title={`Chấm bài thi: ${selectedAttempt?.studentName}`}
        subtitle={`Đề thi: ${selectedAttempt?.quizTitle} · Bản xem trực tiếp bài làm & file tự luận ngay trên Web`}
        maxWidth="860px"
      >
        {selectedAttempt && (
          <form onSubmit={handleSaveGrades} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#3730a3", fontWeight: 700 }}>
                Học viên: <strong>{selectedAttempt.studentName}</strong> · Nộp lúc:{" "}
                {selectedAttempt.submittedAt
                  ? new Date(selectedAttempt.submittedAt).toLocaleString("vi-VN")
                  : "Chưa nộp"}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#4f46e5" }}>
                Tổng điểm dự kiến: {liveTotalPreview.toFixed(2)} / {selectedAttempt.maxScore}đ
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "480px", overflowY: "auto", paddingRight: "4px" }}>
              {questions.map((q, idx) => {
                const answer = selectedAttempt.answers.find((a) => a.questionId === q.id);
                const teacherPromptFile = q.type === "essay" ? q.options?.find((o) => o.attachmentName) : undefined;

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>
                        Câu {idx + 1} ({q.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}) — Tối đa {q.points}đ
                      </strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {teacherPromptFile?.attachmentName && (
                          <button
                            type="button"
                            onClick={() =>
                              setFullscreenAttachment({
                                title: `Đề bài gốc: ${teacherPromptFile.attachmentName}`,
                                payload: {
                                  attachmentName: teacherPromptFile.attachmentName!,
                                  attachmentType: teacherPromptFile.attachmentType || "application/octet-stream",
                                  attachmentSize: teacherPromptFile.attachmentSize || "",
                                  attachmentDataUrl: teacherPromptFile.attachmentDataUrl || "",
                                  attachmentExtractedText: teacherPromptFile.attachmentExtractedText || "",
                                },
                              })
                            }
                            style={{
                              padding: "3px 8px",
                              borderRadius: "5px",
                              border: "1px solid #f59e0b",
                              background: "#fffbeb",
                              color: "#b45309",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            👁️ Xem file đề gốc ({teacherPromptFile.attachmentName})
                          </button>
                        )}
                        {q.type === "multiple_choice" && (
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "3px 8px", borderRadius: 6 }}>
                            ✓ Hệ thống tự động chấm: {answer?.scoreAwarded ?? 0} / {q.points}đ
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#334155", whiteSpace: "pre-wrap" }}>{q.content}</div>

                    {/* Student response & Instant Web Preview for Uploaded Essay File */}
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#6366f1", display: "block" }}>
                        BÀI LÀM CỦA SINH VIÊN:
                      </span>
                      {q.type === "multiple_choice" ? (
                        <div>
                          Phương án sinh viên đã chọn:{" "}
                          <strong>
                            {q.options.find((opt) => opt.id === answer?.selectedOptionId)?.text || "Chưa chọn"}
                          </strong>
                        </div>
                      ) : (
                        <>
                          {answer?.essayAnswer && (
                            <div style={{ whiteSpace: "pre-wrap", color: "#0f172a", lineHeight: "1.55", padding: "8px 10px", background: "#f8fafc", borderRadius: 6 }}>
                              {answer.essayAnswer}
                            </div>
                          )}

                          {/* Instant Web Preview if student uploaded an essay file */}
                          {answer?.attachmentName ? (
                            <div
                              style={{
                                padding: "12px",
                                borderRadius: "8px",
                                background: "#eef2ff",
                                border: "1.5px solid #818cf8",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                <div>
                                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#4338ca" }}>
                                    👁️ BẢN XEM NGAY TẠI WEB — FILE BÀI LÀM SINH VIÊN TẢI LÊN:
                                  </div>
                                  <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>
                                    📎 {answer.attachmentName} {answer.attachmentSize ? `(${answer.attachmentSize})` : ""}
                                  </strong>
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFullscreenAttachment({
                                        title: `Bài làm của ${selectedAttempt.studentName}: ${answer.attachmentName}`,
                                        payload: {
                                          attachmentName: answer.attachmentName!,
                                          attachmentType: answer.attachmentType || "application/octet-stream",
                                          attachmentSize: answer.attachmentSize || "",
                                          attachmentDataUrl: answer.attachmentDataUrl || "",
                                          attachmentExtractedText: answer.attachmentExtractedText || "",
                                        },
                                      })
                                    }
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid #4f46e5",
                                      background: "#ffffff",
                                      color: "#4338ca",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    🔍 Mở rộng toàn màn hình
                                  </button>
                                  {answer.attachmentDataUrl && (
                                    <a
                                      href={answer.attachmentDataUrl}
                                      download={answer.attachmentName}
                                      style={{
                                        padding: "5px 10px",
                                        borderRadius: "6px",
                                        background: "#4f46e5",
                                        color: "#ffffff",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        textDecoration: "none",
                                      }}
                                    >
                                      ⬇️ Tải bài về máy
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Inline embedded preview right inside Grading modal */}
                              {answer.attachmentDataUrl?.startsWith("data:image/") ? (
                                <div style={{ textAlign: "center", background: "#0f172a", padding: 10, borderRadius: 8 }}>
                                  <img
                                    src={answer.attachmentDataUrl}
                                    alt={answer.attachmentName}
                                    style={{ maxWidth: "100%", maxHeight: "320px", borderRadius: 6 }}
                                  />
                                </div>
                              ) : answer.attachmentDataUrl?.startsWith("data:application/pdf") ? (
                                <iframe
                                  src={answer.attachmentDataUrl}
                                  title={answer.attachmentName}
                                  style={{ width: "100%", height: "320px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff" }}
                                />
                              ) : null}

                              {answer.attachmentExtractedText && (
                                <div
                                  style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    background: "#ffffff",
                                    border: "1px solid #c7d2fe",
                                    maxHeight: "260px",
                                    overflowY: "auto",
                                    fontSize: "12px",
                                    lineHeight: 1.6,
                                    color: "#0f172a",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#4338ca", marginBottom: 4 }}>
                                    NỘI DUNG BÀI LÀM TRONG FILE (XEM TRỰC TIẾP):
                                  </div>
                                  {answer.attachmentExtractedText}
                                </div>
                              )}
                            </div>
                          ) : (
                            !answer?.essayAnswer && (
                              <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
                                Sinh viên chưa nhập câu trả lời hoặc chưa tải file bài làm.
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Essay score input by teacher */}
                    {q.type === "essay" && (
                      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px", marginTop: "4px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#3730a3", marginBottom: "4px" }}>
                            Chấm điểm (0 – {q.points}đ):
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            max={q.points}
                            min={0}
                            required
                            value={essayScores[q.id] ?? ""}
                            onChange={(e) =>
                              setEssayScores({ ...essayScores, [q.id]: Number(e.target.value) })
                            }
                            placeholder={`0 - ${q.points}`}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1.5px solid #4f46e5",
                              fontSize: "12.5px",
                              fontWeight: 800,
                              background: "#fff",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                            Nhận xét &amp; sửa bài gửi về cho sinh viên:
                          </label>
                          <input
                            type="text"
                            value={essayFeedbacks[q.id] || ""}
                            onChange={(e) =>
                              setEssayFeedbacks({ ...essayFeedbacks, [q.id]: e.target.value })
                            }
                            placeholder="Ghi chú chi tiết ưu/nhược điểm của câu trả lời này..."
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              background: "#fff",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* General notes */}
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                Lời phê tổng kết của Giảng viên (Gửi kèm thông báo điểm về cho Sinh viên):
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Nhận xét tổng thể bài làm của sinh viên..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setSelectedAttempt(null)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
              >
                Đóng
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4f46e5, #059669)",
                  color: "#fff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ✅ Hoàn tất chấm &amp; Gửi điểm về Sinh viên
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Fullscreen Document Preview */}
      <Modal
        isOpen={!!fullscreenAttachment}
        onClose={() => setFullscreenAttachment(null)}
        title={fullscreenAttachment ? fullscreenAttachment.title : "Xem tài liệu"}
        subtitle="Bản xem trực tiếp trên trình duyệt (Web Preview)"
        maxWidth="900px"
      >
        {fullscreenAttachment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                📎 {fullscreenAttachment.payload.attachmentName}{" "}
                {fullscreenAttachment.payload.attachmentSize ? `(${fullscreenAttachment.payload.attachmentSize})` : ""}
              </span>
              {fullscreenAttachment.payload.attachmentDataUrl && (
                <a
                  href={fullscreenAttachment.payload.attachmentDataUrl}
                  download={fullscreenAttachment.payload.attachmentName}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "#4f46e5",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ⬇️ Tải tệp xuống
                </a>
              )}
            </div>

            {fullscreenAttachment.payload.attachmentDataUrl.startsWith("data:image/") ? (
              <div style={{ textAlign: "center", background: "#0f172a", padding: 12, borderRadius: 8 }}>
                <img
                  src={fullscreenAttachment.payload.attachmentDataUrl}
                  alt={fullscreenAttachment.payload.attachmentName}
                  style={{ maxWidth: "100%", maxHeight: "520px", borderRadius: 6 }}
                />
              </div>
            ) : fullscreenAttachment.payload.attachmentDataUrl.startsWith("data:application/pdf") ? (
              <iframe
                src={fullscreenAttachment.payload.attachmentDataUrl}
                title={fullscreenAttachment.payload.attachmentName}
                style={{ width: "100%", height: "520px", border: "1px solid #cbd5e1", borderRadius: 8 }}
              />
            ) : null}

            {fullscreenAttachment.payload.attachmentExtractedText && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  maxHeight: "440px",
                  overflowY: "auto",
                  fontSize: "12.5px",
                  lineHeight: 1.65,
                  color: "#1e293b",
                  whiteSpace: "pre-wrap",
                }}
              >
                {fullscreenAttachment.payload.attachmentExtractedText}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
