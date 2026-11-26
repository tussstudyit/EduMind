// ============================================================================
// EDUMIND AI - STUDENT QUIZ TAKING & SUBMISSION (MODULE 6 & 7 - LIVE POSTGRESQL DATA)
// Sinh viên làm bài trắc nghiệm (tự động chấm theo cài đặt Giảng viên) &
// bài tự luận (xem đề Giảng viên upload ngay trên Web, tải bài làm lên gửi Giảng viên chấm)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Quiz, Question, QuizAttempt, StudentAnswer } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import {
  readAttachmentFile,
  UploadedAttachmentPayload,
} from "@/services/questionImportService";

export function QuizTaking() {
  const { currentUser, isAuthenticated } = useAuth();
  const { success, info, warning, error } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User in-progress answers
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [essayTexts, setEssayTexts] = useState<Record<string, string>>({});
  const [essayAttachments, setEssayAttachments] = useState<Record<string, UploadedAttachmentPayload>>({});
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{
    title: string;
    payload: UploadedAttachmentPayload;
  } | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  const loadQuizzesAndAttempts = async () => {
    setIsLoading(true);
    try {
      const [quizList, myAttempts] = await Promise.all([
        apiClient.getQuizzes().catch(() => []),
        isAuthenticated ? apiClient.getAttempts().catch(() => []) : Promise.resolve([]),
      ]);
      setQuizzes(quizList.filter((q) => q.isPublished));
      setAttempts(myAttempts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuizzesAndAttempts();
  }, [currentUser.id, isAuthenticated]);

  const handleStartQuiz = async (quiz: Quiz) => {
    if (!isAuthenticated) {
      info("Cần đăng nhập", "Vui lòng đăng nhập tài khoản Học viên để bắt đầu làm bài kiểm tra.");
      return;
    }

    try {
      const [qList, latestAttempts] = await Promise.all([
        apiClient.getQuestions(quiz.id),
        apiClient.getAttempts(quiz.id).catch(() => attempts),
      ]);
      setQuestions(qList);

      // Nếu đã nộp/chấm trước đó thì mở lại bản đã nộp, ngược lại khởi tạo/lấy bản nháp đang làm
      const existingCompleted = latestAttempts.find(
        (a) => a.quizId === quiz.id && (a.status === "submitted" || a.status === "graded"),
      );
      const att = existingCompleted || (await apiClient.startQuizAttempt(quiz.id));

      setActiveQuiz(quiz);
      setAttempt(att);
      setTimeLeft(Math.max(1, quiz.timeLimitMinutes) * 60);

      const opts: Record<string, string> = {};
      const essays: Record<string, string> = {};
      const files: Record<string, UploadedAttachmentPayload> = {};
      att.answers.forEach((ans) => {
        if (ans.selectedOptionId) opts[ans.questionId] = ans.selectedOptionId;
        if (ans.essayAnswer) essays[ans.questionId] = ans.essayAnswer;
        if (ans.attachmentName) {
          files[ans.questionId] = {
            attachmentName: ans.attachmentName,
            attachmentType: ans.attachmentType || "application/octet-stream",
            attachmentSize: ans.attachmentSize || "",
            attachmentDataUrl: ans.attachmentDataUrl || "",
            attachmentExtractedText: ans.attachmentExtractedText || "",
          };
        }
      });
      setSelectedOptions(opts);
      setEssayTexts(essays);
      setEssayAttachments(files);

      if (att.answers.length > 0 && att.status === "in_progress") {
        setLastDraftSavedAt("Trước đó");
      } else {
        setLastDraftSavedAt(null);
      }
    } catch (err) {
      error("Không thể mở đề thi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || attempt?.status !== "in_progress") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void executeSubmit();
          warning("Hết giờ làm bài!", "Hệ thống đã tự động thu bài của bạn.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, attempt?.status]);

  const buildAnswersPayload = (): StudentAnswer[] =>
    questions.map((q) => {
      const filePayload = essayAttachments[q.id];
      return {
        questionId: q.id,
        selectedOptionId: selectedOptions[q.id],
        essayAnswer: essayTexts[q.id] || "",
        ...(filePayload ? filePayload : {}),
      };
    });

  const handleStudentUploadEssayFile = async (questionId: string, file?: File) => {
    if (!file) return;
    setUploadingQuestionId(questionId);
    try {
      const payload = await readAttachmentFile(file);
      setEssayAttachments((prev) => ({ ...prev, [questionId]: payload }));
      if (!essayTexts[questionId]?.trim()) {
        setEssayTexts((prev) => ({
          ...prev,
          [questionId]: `Đã đính kèm tệp bài làm: ${payload.attachmentName} (${payload.attachmentSize})`,
        }));
      }
      success(
        "Đã tải lên tệp bài làm tự luận",
        `Tệp "${payload.attachmentName}" đã được đính kèm. Khi nộp bài, giảng viên sẽ có bản xem trực tiếp ngay trên web.`,
      );
    } catch (err) {
      error("Không đọc được tệp bài làm", err instanceof Error ? err.message : "Vui lòng chọn tệp dưới 20MB.");
    } finally {
      setUploadingQuestionId(null);
    }
  };

  const handleRemoveStudentEssayFile = (questionId: string) => {
    setEssayAttachments((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSaveDraft = async () => {
    if (!attempt) return;

    const answersPayload = buildAnswersPayload();

    try {
      const updated = await apiClient.saveAttemptDraft(attempt.id, answersPayload);
      setAttempt(updated);
      const timeStr = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastDraftSavedAt(timeStr);
      success(
        "Đã lưu câu trả lời nháp",
        `Bài làm và tệp đính kèm đã được đồng bộ lên máy chủ lúc ${timeStr}.`,
      );
    } catch (err) {
      error("Không lưu được nháp", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleOpenSubmitConfirm = () => {
    if (!attempt) return;
    if (attempt.status !== "in_progress") {
      info("Bài thi đã nộp trước đó.");
      return;
    }
    setIsSubmitConfirmOpen(true);
  };

  const executeSubmit = async () => {
    if (!attempt) return;

    const answersPayload = buildAnswersPayload();

    try {
      const submitted = await apiClient.submitAttempt(attempt.id, answersPayload);
      setAttempt(submitted);
      setIsSubmitConfirmOpen(false);
      await loadQuizzesAndAttempts();
      const passed = activeQuiz ? Number(submitted.totalScore) >= Number(activeQuiz.passingScore) : true;
      success(
        "Nộp bài thành công!",
        submitted.status === "graded"
          ? `Hệ thống đã chấm tự động theo cài đặt giảng viên: ${submitted.totalScore}/${submitted.maxScore}đ (${passed ? "ĐẠT" : "CHƯA ĐẠT"}).`
          : `Đã chấm tự động phần trắc nghiệm (${submitted.totalScore}đ) và gửi bài làm/tệp tự luận sang Giảng viên chấm điểm.`,
      );
    } catch (err) {
      error("Không thể nộp bài", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // If viewing list of quizzes
  if (!activeQuiz) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">MODULE 6 & 7: BÀI TẬP & BÀI KIỂM TRA ĐÁNH GIÁ</span>
            <h2>Kiểm tra Kiến thức Trực tuyến</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {isLoading ? (
            <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              Đang tải danh sách bài kiểm tra...
            </div>
          ) : quizzes.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                padding: "60px 24px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "2px dashed #cbd5e1",
                textAlign: "center",
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
                <Icon name="award" size={28} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>
                  Chưa có bài kiểm tra nào được xuất bản
                </strong>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b", maxWidth: "360px", lineHeight: "1.6" }}>
                  Giảng viên chưa xuất bản đề thi nào. Hãy tham gia khóa học để nhận thông báo khi có bài kiểm tra mới.
                </p>
              </div>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const myAttempt = attempts.find((a) => a.quizId === quiz.id);
              const isPassed = myAttempt ? Number(myAttempt.totalScore) >= Number(quiz.passingScore) : false;
              return (
                <div
                  key={quiz.id}
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{quiz.courseId ? quiz.courseTitle : "ĐỀ ĐỘC LẬP"}</span>
                    {myAttempt && (
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: 800,
                          background:
                            myAttempt.status === "graded"
                              ? isPassed
                                ? "#ecfdf5"
                                : "#fef2f2"
                              : "#fffbeb",
                          color:
                            myAttempt.status === "graded"
                              ? isPassed
                                ? "#065f46"
                                : "#dc2626"
                              : "#b45309",
                        }}
                      >
                        {myAttempt.status === "graded"
                          ? `${myAttempt.totalScore}/${myAttempt.maxScore}đ (${isPassed ? "ĐẠT" : "CHƯA ĐẠT"})`
                          : myAttempt.status === "submitted"
                          ? "ĐÃ NỘP (CHỜ GIẢNG VIÊN CHẤM)"
                          : "ĐANG LÀM DỞ"}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: "2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                    {quiz.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b", lineHeight: "1.4" }}>
                    {quiz.description || "Đề kiểm tra đánh giá năng lực học viên."}
                  </p>

                  <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#64748b", marginTop: "4px", flexWrap: "wrap" }}>
                    <span>⏱️ {quiz.timeLimitMinutes} phút</span>
                    <span>❓ {quiz.questionCount} câu hỏi</span>
                    <span>🎯 Chuẩn đạt: <strong>{quiz.passingScore}/{quiz.maxScore}đ</strong></span>
                  </div>

                  <button
                    onClick={() => void handleStartQuiz(quiz)}
                    style={{
                      marginTop: "auto",
                      padding: "8px 0",
                      borderRadius: "8px",
                      background: myAttempt?.status === "graded" ? "#f1f5f9" : "#4f46e5",
                      color: myAttempt?.status === "graded" ? "#334155" : "#ffffff",
                      border: "none",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {myAttempt?.status === "graded"
                      ? "Xem kết quả chấm điểm & Nhận xét"
                      : myAttempt?.status === "submitted"
                      ? "Xem bài đã nộp (Đang chờ Giảng viên chấm)"
                      : "Bắt đầu làm bài thi"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Active Quiz Exam View
  const isLocked = attempt?.status === "submitted" || attempt?.status === "graded";
  const mcQuestions = questions.filter((q) => q.type === "multiple_choice");
  const correctMcCount = mcQuestions.filter((q) => {
    const ans = attempt?.answers.find((a) => a.questionId === q.id);
    return ans?.isCorrect || (ans?.scoreAwarded !== undefined && Number(ans.scoreAwarded) > 0);
  }).length;
  const isPassedAttempt =
    attempt && activeQuiz ? Number(attempt.totalScore) >= Number(activeQuiz.passingScore) : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Quiz Top bar */}
      <div
        style={{
          padding: "14px 20px",
          borderRadius: "12px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: "80px",
          zIndex: 50,
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => {
              setActiveQuiz(null);
              void loadQuizzesAndAttempts();
            }}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            ← Quay lại
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "15px", color: "#1e293b" }}>{activeQuiz.title}</h2>
              {!isLocked && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: lastDraftSavedAt ? "#ecfdf5" : "#fffbeb",
                    color: lastDraftSavedAt ? "#065f46" : "#b45309",
                    border: lastDraftSavedAt ? "1px solid #a7f3d0" : "1px solid #fde68a",
                  }}
                >
                  {lastDraftSavedAt ? `✓ Đã lưu nháp (${lastDraftSavedAt})` : "Bản nháp chưa lưu"}
                </span>
              )}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Cài đặt Giảng viên: Thời gian <strong>{activeQuiz.timeLimitMinutes} phút</strong> · Điểm chuẩn đạt:{" "}
              <strong>{activeQuiz.passingScore}/{activeQuiz.maxScore}đ</strong>
            </span>
          </div>
        </div>

        {/* Timer or Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isLocked ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: timeLeft < 180 ? "#fee2e2" : "#f1f5f9",
                color: timeLeft < 180 ? "#dc2626" : "#334155",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              <Icon name="clock" size={16} />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          ) : (
            <div
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background:
                  attempt?.status === "graded"
                    ? isPassedAttempt
                      ? "#ecfdf5"
                      : "#fef2f2"
                    : "#fffbeb",
                color:
                  attempt?.status === "graded"
                    ? isPassedAttempt
                      ? "#065f46"
                      : "#dc2626"
                    : "#b45309",
                fontWeight: 800,
                fontSize: "12px",
              }}
            >
              {attempt?.status === "graded"
                ? `Điểm: ${attempt.totalScore} / ${attempt.maxScore}đ (${isPassedAttempt ? "ĐẠT" : "CHƯA ĐẠT"})`
                : "Đã gửi Giảng viên chấm tự luận"}
            </div>
          )}

          {!isLocked && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => void handleSaveDraft()}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Lưu nháp
              </button>
              <button
                onClick={handleOpenSubmitConfirm}
                style={{
                  padding: "7px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Nộp bài thi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Grading & Teacher Evaluation Result Card */}
      {isLocked && attempt && (
        <div
          style={{
            padding: "18px 20px",
            borderRadius: "12px",
            background:
              attempt.status === "graded"
                ? isPassedAttempt
                  ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)"
                  : "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)"
                : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border:
              attempt.status === "graded"
                ? isPassedAttempt
                  ? "1.5px solid #6ee7b7"
                  : "1.5px solid #fca5a5"
                : "1.5px solid #fcd34d",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", letterSpacing: 0.5 }}>
                KẾT QUẢ CHẤM ĐIỂM THEO CÀI ĐẶT CỦA GIẢNG VIÊN
              </span>
              <h3 style={{ margin: "4px 0 0", fontSize: "16px", color: "#0f172a" }}>
                {attempt.status === "graded"
                  ? isPassedAttempt
                    ? `🎉 Chúc mừng! Bạn đã ĐẠT bài kiểm tra (${attempt.totalScore}/${attempt.maxScore} điểm)`
                    : `⚠️ Bạn CHƯA ĐẠT điểm chuẩn (${attempt.totalScore}/${attempt.maxScore} điểm — Cần đạt tối thiểu ${activeQuiz.passingScore}đ)`
                  : `⏳ Đã nộp bài thành công! Bài tự luận của bạn đã gửi tới Giảng viên chờ chấm điểm`}
              </h3>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ padding: "8px 14px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>TỔNG ĐIỂM</div>
                <strong style={{ fontSize: "16px", color: "#4f46e5" }}>
                  {attempt.totalScore} / {attempt.maxScore}đ
                </strong>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>ĐIỂM CHUẨN ĐẠT</div>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{activeQuiz.passingScore}đ</strong>
              </div>
              {mcQuestions.length > 0 && (
                <div style={{ padding: "8px 14px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>TRẮC NGHIỆM ĐÚNG</div>
                  <strong style={{ fontSize: "16px", color: "#059669" }}>
                    {correctMcCount} / {mcQuestions.length} câu
                  </strong>
                </div>
              )}
            </div>
          </div>

          {attempt.status === "graded" && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                color: "#1e293b",
              }}
            >
              <strong>💬 Nhận xét &amp; Đánh giá từ ({attempt.gradedBy || "Hệ thống chấm tự động"}):</strong>{" "}
              {attempt.teacherNotes || "Đã hoàn tất chấm điểm dựa trên đáp án và biểu điểm của giảng viên."}
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {questions.map((q, idx) => {
          const ans = attempt?.answers.find((a) => a.questionId === q.id);
          const teacherEssayPromptFile = q.type === "essay" ? q.options?.find((o) => o.attachmentName) : undefined;
          const studentEssayUploadedFile = essayAttachments[q.id];

          return (
            <div
              key={q.id}
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1" }}>
                  CÂU HỎI {idx + 1} ({q.type === "multiple_choice" ? "TRẮC NGHIỆM - CHẤM TỰ ĐỘNG" : "TỰ LUẬN - NỘP BÀI CHO GIẢNG VIÊN"}) · {q.points} ĐIỂM
                </span>
                {isLocked && ans?.scoreAwarded !== undefined && (
                  <span
                    style={{
                      padding: "3px 9px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      background: Number(ans.scoreAwarded) > 0 ? "#ecfdf5" : "#fef2f2",
                      color: Number(ans.scoreAwarded) > 0 ? "#047857" : "#dc2626",
                    }}
                  >
                    {q.type === "multiple_choice"
                      ? Number(ans.scoreAwarded) > 0
                        ? `✓ Chính xác (+${ans.scoreAwarded}/${q.points}đ)`
                        : `✗ Sai (0/${q.points}đ)`
                      : `Điểm giảng viên chấm: ${ans.scoreAwarded} / ${q.points}đ`}
                  </span>
                )}
              </div>

              <div style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, lineHeight: "1.55", whiteSpace: "pre-wrap" }}>
                {q.content}
              </div>

              {/* Teacher's Uploaded Essay Prompt File (Requirement 3) */}
              {q.type === "essay" && teacherEssayPromptFile?.attachmentName && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    border: "1.5px solid #f59e0b",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="fileText" size={18} />
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: "#b45309" }}>
                          ĐỀ BÀI TỰ LUẬN GIẢNG VIÊN TẢI LÊN:
                        </div>
                        <strong style={{ fontSize: "12.5px", color: "#78350f" }}>
                          {teacherEssayPromptFile.attachmentName}{" "}
                          {teacherEssayPromptFile.attachmentSize ? `(${teacherEssayPromptFile.attachmentSize})` : ""}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setViewingAttachment({
                            title: `Đề bài tự luận: ${teacherEssayPromptFile.attachmentName}`,
                            payload: {
                              attachmentName: teacherEssayPromptFile.attachmentName!,
                              attachmentType: teacherEssayPromptFile.attachmentType || "application/octet-stream",
                              attachmentSize: teacherEssayPromptFile.attachmentSize || "",
                              attachmentDataUrl: teacherEssayPromptFile.attachmentDataUrl || "",
                              attachmentExtractedText: teacherEssayPromptFile.attachmentExtractedText || "",
                            },
                          })
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #d97706",
                          background: "#ffffff",
                          color: "#b45309",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        👁️ Xem đề bài trực tiếp trên Web
                      </button>
                      {teacherEssayPromptFile.attachmentDataUrl && (
                        <a
                          href={teacherEssayPromptFile.attachmentDataUrl}
                          download={teacherEssayPromptFile.attachmentName}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#d97706",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          ⬇️ Tải đề bài về máy
                        </a>
                      )}
                    </div>
                  </div>

                  {teacherEssayPromptFile.attachmentExtractedText && (
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #fde68a",
                        fontSize: "12px",
                        color: "#1e293b",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        maxHeight: "220px",
                        overflowY: "auto",
                      }}
                    >
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#b45309", marginBottom: 4 }}>
                        NỘI DUNG ĐỀ BÀI TRÍCH XUẤT:
                      </div>
                      {teacherEssayPromptFile.attachmentExtractedText}
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Choice Options */}
              {q.type === "multiple_choice" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOptions[q.id] === opt.id;
                    const isCorrectAfterSubmit = isLocked && ans?.correctOptionId === opt.id;
                    const isWrongSelection = isLocked && isSelected && ans?.isCorrect === false;
                    const optLabel = String.fromCharCode(65 + optIdx);

                    return (
                      <label
                        key={opt.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: isCorrectAfterSubmit
                            ? "2px solid #10b981"
                            : isWrongSelection
                            ? "2px solid #ef4444"
                            : isSelected
                            ? "1.5px solid #4f46e5"
                            : "1px solid #e2e8f0",
                          background: isCorrectAfterSubmit
                            ? "#ecfdf5"
                            : isWrongSelection
                            ? "#fef2f2"
                            : isSelected
                            ? "#f5f3ff"
                            : "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          cursor: isLocked ? "default" : "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            disabled={isLocked}
                            checked={isSelected}
                            onChange={() => setSelectedOptions({ ...selectedOptions, [q.id]: opt.id })}
                            style={{ cursor: isLocked ? "default" : "pointer" }}
                          />
                          <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: isSelected || isCorrectAfterSubmit ? 700 : 500 }}>
                            <strong>{optLabel}.</strong> {opt.text}
                          </span>
                        </div>
                        {isCorrectAfterSubmit && (
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "#047857", background: "#a7f3d0", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                            ✓ Đáp án đúng
                          </span>
                        )}
                        {isWrongSelection && (
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "#dc2626", background: "#fecaca", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                            ✗ Bạn chọn
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <textarea
                    rows={4}
                    disabled={isLocked}
                    value={essayTexts[q.id] || ""}
                    onChange={(e) => setEssayTexts({ ...essayTexts, [q.id]: e.target.value })}
                    placeholder="Nhập nội dung bài giải tự luận trực tiếp tại đây và/hoặc tải file bài làm của bạn lên ở khung bên dưới..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: isLocked ? "#f8fafc" : "#ffffff",
                      cursor: isLocked ? "not-allowed" : "text",
                    }}
                  />

                  {/* Student Upload Essay Work File Section (Requirement 3) */}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: studentEssayUploadedFile ? "#eef2ff" : "#f8fafc",
                      border: studentEssayUploadedFile ? "1.5px solid #818cf8" : "1px dashed #94a3b8",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="upload" size={16} />
                      {uploadingQuestionId === q.id ? (
                        <span style={{ fontSize: "11.5px", color: "#4338ca", fontWeight: 700 }}>
                          Đang xử lý tệp bài làm...
                        </span>
                      ) : studentEssayUploadedFile ? (
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#4338ca" }}>
                            TỆP BÀI LÀM TỰ LUẬN CỦA BẠN ĐÃ ĐÍNH KÈM:
                          </div>
                          <strong style={{ fontSize: "12px", color: "#1e293b" }}>
                            📎 {studentEssayUploadedFile.attachmentName}{" "}
                            {studentEssayUploadedFile.attachmentSize ? `(${studentEssayUploadedFile.attachmentSize})` : ""}
                          </strong>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11.5px", color: "#475569" }}>
                          Làm bài ra file (Word/DOCX, PDF, Ảnh chụp bài giải, TXT, Code) rồi tải lên đây để gửi qua Giảng viên chấm trên Web.
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {studentEssayUploadedFile && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setViewingAttachment({
                                title: `Bài làm đã tải lên: ${studentEssayUploadedFile.attachmentName}`,
                                payload: studentEssayUploadedFile,
                              })
                            }
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #4f46e5",
                              background: "#ffffff",
                              color: "#4338ca",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            👁️ Xem bản nộp trên Web
                          </button>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStudentEssayFile(q.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #fca5a5",
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Xóa file
                            </button>
                          )}
                        </>
                      )}

                      {!isLocked && (
                        <label
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            background: "#4f46e5",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          📤 {studentEssayUploadedFile ? "Đổi file bài làm" : "Upload file bài làm tự luận"}
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.py,.js,.ts,.java,.cpp,.c,.sql,.json"
                            onChange={(e) => void handleStudentUploadEssayFile(q.id, e.target.files?.[0])}
                            style={{ display: "none" }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {ans?.teacherFeedback && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#065f46",
                        background: "#ecfdf5",
                        border: "1px solid #6ee7b7",
                        padding: "10px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      💬 <strong>Nhận xét chi tiết của Giảng viên cho câu này:</strong> {ans.teacherFeedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Xem trực tiếp file Đề bài / Bài làm tự luận trên Web */}
      <Modal
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        title={viewingAttachment ? viewingAttachment.title : "Xem tài liệu trực tiếp"}
        subtitle="Bản xem trực tiếp ngay trên Web (Web Preview)"
        maxWidth="840px"
      >
        {viewingAttachment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                📎 {viewingAttachment.payload.attachmentName}{" "}
                {viewingAttachment.payload.attachmentSize ? `(${viewingAttachment.payload.attachmentSize})` : ""}
              </span>
              {viewingAttachment.payload.attachmentDataUrl && (
                <a
                  href={viewingAttachment.payload.attachmentDataUrl}
                  download={viewingAttachment.payload.attachmentName}
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

            {viewingAttachment.payload.attachmentDataUrl.startsWith("data:image/") ? (
              <div style={{ textAlign: "center", background: "#0f172a", padding: 12, borderRadius: 8 }}>
                <img
                  src={viewingAttachment.payload.attachmentDataUrl}
                  alt={viewingAttachment.payload.attachmentName}
                  style={{ maxWidth: "100%", maxHeight: "480px", borderRadius: 6 }}
                />
              </div>
            ) : viewingAttachment.payload.attachmentDataUrl.startsWith("data:application/pdf") ? (
              <iframe
                src={viewingAttachment.payload.attachmentDataUrl}
                title={viewingAttachment.payload.attachmentName}
                style={{ width: "100%", height: "480px", border: "1px solid #cbd5e1", borderRadius: 8 }}
              />
            ) : null}

            {viewingAttachment.payload.attachmentExtractedText && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontSize: "12.5px",
                  lineHeight: 1.65,
                  color: "#1e293b",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6366f1", marginBottom: 6 }}>
                  NỘI DUNG VĂN BẢN HIỂN THỊ TRỰC TIẾP TRÊN WEB:
                </div>
                {viewingAttachment.payload.attachmentExtractedText}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Xác nhận nộp bài kiểm tra"
        subtitle={activeQuiz ? `Đề thi: ${activeQuiz.title}` : ""}
        maxWidth="500px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "12px",
              color: "#92400e",
            }}
          >
            <span style={{ color: "#d97706" }}><Icon name="alertCircle" size={18} /></span>
            <div>
              <strong>Lưu ý quan trọng:</strong>
              <div style={{ marginTop: "2px", lineHeight: "1.4" }}>
                Sau khi bấm <strong>Xác nhận nộp bài</strong>, hệ thống sẽ <strong>tự động chấm điểm phần trắc nghiệm</strong> theo cài đặt của giảng viên và <strong>gửi bài làm / tệp đính kèm tự luận</strong> tới giảng viên để chấm điểm.
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "8px" }}>
              TIẾN ĐỘ LÀM BÀI CỦA BẠN:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#334155" }}>Câu hỏi trắc nghiệm đã chọn:</span>
                <strong style={{ color: "#4f46e5" }}>
                  {questions.filter((q) => q.type === "multiple_choice" && selectedOptions[q.id]).length} /{" "}
                  {questions.filter((q) => q.type === "multiple_choice").length} câu
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#334155" }}>Câu hỏi tự luận đã làm / tải file:</span>
                <strong style={{ color: "#4f46e5" }}>
                  {
                    questions.filter(
                      (q) => q.type === "essay" && (essayTexts[q.id]?.trim() || essayAttachments[q.id]?.attachmentName),
                    ).length
                  }{" "}
                  / {questions.filter((q) => q.type === "essay").length} câu
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => setIsSubmitConfirmOpen(false)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tiếp tục làm bài
            </button>
            <button
              type="button"
              onClick={() => void executeSubmit()}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Xác nhận nộp bài
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
