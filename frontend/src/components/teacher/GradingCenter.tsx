// ============================================================================
// EDUMIND AI - GRADING CENTER COMPONENT (MODULE 7)
// Giáo viên xem danh sách bài làm, chấm câu hỏi tự luận, nhận xét & khóa điểm
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { QuizAttempt, Question } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function GradingCenter() {
  const { currentUser } = useAuth();
  const { success } = useToast();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Grading form state
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [essayFeedbacks, setEssayFeedbacks] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");

  const loadAttempts = () => {
    const list = storageService.getAttempts();
    setAttempts(list);
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleOpenGradeModal = (att: QuizAttempt) => {
    setSelectedAttempt(att);
    const qList = storageService.getQuestions(att.quizId, "teacher");
    setQuestions(qList);

    // Điền điểm và feedback hiện có
    const initialScores: Record<string, number> = {};
    const initialFb: Record<string, string> = {};

    att.answers.forEach((ans) => {
      if (ans.scoreAwarded !== undefined) {
        initialScores[ans.questionId] = ans.scoreAwarded;
      }
      if (ans.teacherFeedback) {
        initialFb[ans.questionId] = ans.teacherFeedback;
      }
    });

    setEssayScores(initialScores);
    setEssayFeedbacks(initialFb);
    setGeneralNotes(att.teacherNotes || "");
  };

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    const gradesPayload = Object.keys(essayScores).map((qId) => ({
      questionId: qId,
      scoreAwarded: Number(essayScores[qId] || 0),
      teacherFeedback: essayFeedbacks[qId] || "",
    }));

    const updated = storageService.gradeAttempt(
      selectedAttempt.id,
      gradesPayload,
      generalNotes,
      currentUser.name
    );

    if (updated) {
      success(
        "Chấm điểm hoàn tất!",
        `Bài làm của ${updated.studentName} đã được cập nhật: ${updated.totalScore}/${updated.maxScore} điểm.`
      );
    }

    setSelectedAttempt(null);
    loadAttempts();
  };

  const filtered = attempts.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 7: BÀI LÀM VÀ CHẤM ĐIỂM (TEACHER)</span>
          <h2>Trung tâm Đánh giá & Chấm điểm Tự luận</h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { id: "all", label: "Tất cả bài làm" },
          { id: "submitted", label: "Cần chấm tự luận (Chờ duyệt)" },
          { id: "graded", label: "Đã chấm xong" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
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
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Thời gian nộp</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 700 }}>Tổng điểm</th>
              <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((att) => (
              <tr key={att.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#fee2e2",
                        color: "#dc2626",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      {att.studentAvatar}
                    </div>
                    <div>
                      <strong style={{ color: "#1e293b", display: "block" }}>{att.studentName}</strong>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>ID: {att.studentId}</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600 }}>{att.quizTitle}</td>
                <td style={{ padding: "12px 16px", color: "#64748b" }}>
                  {att.submittedAt
                    ? new Date(att.submittedAt).toLocaleString("vi-VN")
                    : "Đang làm bài"}
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
                      ? "Đã chấm điểm"
                      : att.status === "submitted"
                      ? "Chờ chấm tự luận"
                      : "Đang làm"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <strong style={{ fontSize: "14px", color: "#4f46e5" }}>
                    {att.totalScore}
                  </strong>{" "}
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>/ {att.maxScore}đ</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => handleOpenGradeModal(att)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: att.status === "submitted" ? "#4f46e5" : "#f1f5f9",
                      color: att.status === "submitted" ? "#ffffff" : "#475569",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {att.status === "submitted" ? "Chấm bài ngay" : "Xem lại bài"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Chấm điểm */}
      <Modal
        isOpen={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        title={`Chấm bài thi: ${selectedAttempt?.studentName}`}
        subtitle={`Bài thi: ${selectedAttempt?.quizTitle} · Nội dung đã khóa sau khi nộp`}
        maxWidth="680px"
      >
        {selectedAttempt && (
          <form onSubmit={handleSaveGrades} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {questions.map((q, idx) => {
                const answer = selectedAttempt.answers.find((a) => a.questionId === q.id);

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "12px", color: "#1e293b" }}>
                        Câu {idx + 1} ({q.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}) - Tối đa {q.points}đ
                      </strong>
                      {q.type === "multiple_choice" && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
                          ✓ Tự động chấm: {answer?.scoreAwarded || 0}đ
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "12px", color: "#334155" }}>{q.content}</div>

                    {/* Student response */}
                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "6px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        fontSize: "11.5px",
                      }}
                    >
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>
                        CÂU TRẢ LỜI CỦA SINH VIÊN (NỘI DUNG ĐÃ KHÓA):
                      </span>
                      {q.type === "multiple_choice" ? (
                        <div>
                          Phương án đã chọn:{" "}
                          <strong>
                            {q.options.find((opt) => opt.id === answer?.selectedOptionId)?.text || "Chưa chọn"}
                          </strong>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", color: "#1e293b", lineHeight: "1.4" }}>
                          {answer?.essayAnswer || "Học sinh không điền câu trả lời."}
                        </div>
                      )}
                    </div>

                    {/* Essay score input by teacher */}
                    {q.type === "essay" && (
                      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px", marginTop: "4px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Điểm tự luận:
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            max={q.points}
                            min={0}
                            value={essayScores[q.id] ?? ""}
                            onChange={(e) =>
                              setEssayScores({ ...essayScores, [q.id]: Number(e.target.value) })
                            }
                            placeholder={`0 - ${q.points}`}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #4f46e5",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Nhận xét câu trả lời:
                          </label>
                          <input
                            type="text"
                            value={essayFeedbacks[q.id] || ""}
                            onChange={(e) =>
                              setEssayFeedbacks({ ...essayFeedbacks, [q.id]: e.target.value })
                            }
                            placeholder="Ghi chú góp ý cho học sinh..."
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "11px",
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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Lời phê & Đánh giá chung của Thầy/Cô:
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Nhận xét tổng thể bài thi..."
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
                style={{ padding: "8px 18px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Lưu & Khóa điểm bài làm
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
