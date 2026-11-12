// ============================================================================
// EDUMIND AI - STUDENT QUIZ TAKING & SUBMISSION (MODULE 6 & 7)
// Học sinh làm bài kiểm tra: Lưu nháp, đồng hồ đếm ngược, nộp bài & khóa nội dung
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Quiz, Question, QuizAttempt, StudentAnswer } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function QuizTaking() {
  const { currentUser } = useAuth();
  const { success, info, warning } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  // User in-progress answers
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [essayTexts, setEssayTexts] = useState<Record<string, string>>({});
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  useEffect(() => {
    // Chỉ lấy đề thi đã xuất bản (published)
    const list = storageService.getQuizzes().filter((q) => q.isPublished);
    setQuizzes(list);
  }, []);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    // RBAC: Học sinh chỉ nhận câu hỏi KHÔNG có đáp án đúng
    const qList = storageService.getQuestions(quiz.id, "student");
    setQuestions(qList);

    // Khởi tạo hoặc lấy lại lượt làm bài của học sinh
    const att = storageService.startOrGetAttempt(quiz.id, currentUser);
    setAttempt(att);
    setTimeLeft(quiz.timeLimitMinutes * 60);

    // Điền lại câu trả lời nếu đã lưu nháp trước đó
    const opts: Record<string, string> = {};
    const essays: Record<string, string> = {};
    att.answers.forEach((ans) => {
      if (ans.selectedOptionId) opts[ans.questionId] = ans.selectedOptionId;
      if (ans.essayAnswer) essays[ans.questionId] = ans.essayAnswer;
    });
    setSelectedOptions(opts);
    setEssayTexts(essays);

    if (att.answers.length > 0 && att.status === "in_progress") {
      setLastDraftSavedAt("Trước đó");
    } else {
      setLastDraftSavedAt(null);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || attempt?.status !== "in_progress") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          executeSubmit();
          warning("Hết giờ làm bài!", "Hệ thống đã tự động thu bài của bạn.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, attempt?.status]);

  const handleSaveDraft = () => {
    if (!attempt) return;

    const answersPayload: StudentAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selectedOptions[q.id],
      essayAnswer: essayTexts[q.id] || "",
    }));

    storageService.saveAttemptDraft(attempt.id, answersPayload);
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastDraftSavedAt(timeStr);
    success("Đã lưu câu trả lời nháp", `Trạng thái nháp đã được lưu lúc ${timeStr}. Bạn có thể tiếp tục làm bất kỳ lúc nào.`);
  };

  const handleOpenSubmitConfirm = () => {
    if (!attempt) return;
    if (attempt.status !== "in_progress") {
      info("Bài thi đã nộp trước đó.");
      return;
    }
    setIsSubmitConfirmOpen(true);
  };

  const executeSubmit = () => {
    if (!attempt) return;

    const answersPayload: StudentAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selectedOptions[q.id],
      essayAnswer: essayTexts[q.id] || "",
    }));

    const submitted = storageService.submitAttempt(attempt.id, answersPayload);
    if (submitted) {
      setAttempt(submitted);
      setIsSubmitConfirmOpen(false);
      success(
        "Nộp bài thành công!",
        `Bài thi đã được khóa nội dung. Điểm trắc nghiệm: ${submitted.totalScore}đ. Phần tự luận đang chờ Giảng viên chấm.`
      );
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
          {quizzes.map((quiz) => {
            const myAttempt = storageService.getAttempts(quiz.id, currentUser.id)[0];
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
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{quiz.courseTitle}</span>
                  {myAttempt && (
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background: myAttempt.status === "graded" ? "#ecfdf5" : "#fffbeb",
                        color: myAttempt.status === "graded" ? "#065f46" : "#b45309",
                      }}
                    >
                      {myAttempt.status === "graded"
                        ? `ĐẠT ${myAttempt.totalScore}đ`
                        : "ĐÃ NỘP (CHỜ CHẤM)"}
                    </span>
                  )}
                </div>

                <h3 style={{ margin: "2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  {quiz.title}
                </h3>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b", lineHeight: "1.4" }}>
                  {quiz.description}
                </p>

                <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  <span>⏱️ {quiz.timeLimitMinutes} phút</span>
                  <span>❓ {quiz.questionCount} câu hỏi</span>
                  <span>🎯 Điểm đạt: {quiz.passingScore}đ</span>
                </div>

                <button
                  onClick={() => handleStartQuiz(quiz)}
                  style={{
                    marginTop: "auto",
                    padding: "8px 0",
                    borderRadius: "8px",
                    background: myAttempt?.status === "graded" ? "#f1f5f9" : "#4f46e5",
                    color: myAttempt?.status === "graded" ? "#475569" : "#ffffff",
                    border: "none",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {myAttempt?.status === "graded"
                    ? "Xem lại bài thi & Điểm số"
                    : myAttempt?.status === "submitted"
                    ? "Xem lại bài đã nộp (Đã khóa)"
                    : "Bắt đầu làm bài thi"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz Exam View
  const isLocked = attempt?.status === "submitted" || attempt?.status === "graded";

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
            onClick={() => setActiveQuiz(null)}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            <span style={{ fontSize: "10.5px", color: "#64748b" }}>
              {isLocked ? "🔒 Bài thi đã nộp (Nội dung bài làm đã bị khóa chỉ đọc)" : "Học viên đang làm bài"}
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
                background: attempt?.status === "graded" ? "#ecfdf5" : "#fffbeb",
                color: attempt?.status === "graded" ? "#065f46" : "#b45309",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {attempt?.status === "graded"
                ? `Tổng điểm: ${attempt.totalScore} / ${attempt.maxScore}đ`
                : "Đang chờ chấm tự luận"}
            </div>
          )}

          {!isLocked && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSaveDraft}
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

      {/* Locked notice banner if submitted or graded */}
      {isLocked && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ color: "#475569" }}><Icon name="lock" size={20} /></span>
          <div>
            <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>
              Bài làm đã nộp thành công · Chế độ chỉ đọc (Nội dung đã bị khóa hoàn toàn)
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              {attempt?.status === "graded"
                ? "Giảng viên đã hoàn tất chấm điểm và gửi nhận xét bên dưới."
                : "Bài làm của bạn đang được lưu trong hàng chờ chấm của Giảng viên. Toàn bộ các lựa chọn đã được khóa bảo mật."}
            </p>
          </div>
        </div>
      )}

      {/* Teacher feedback banner if graded */}
      {attempt?.status === "graded" && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "10px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <span style={{ color: "#059669" }}><Icon name="checkCircle" size={20} /></span>
          <div>
            <strong style={{ fontSize: "13px", color: "#065f46" }}>
              Nhận xét từ Giảng viên ({attempt.gradedBy || "Thầy giáo"}):
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#047857" }}>
              {attempt.teacherNotes || "Bài thi đạt kết quả tốt!"}
            </p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {questions.map((q, idx) => {
          const ans = attempt?.answers.find((a) => a.questionId === q.id);

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1" }}>
                  CÂU HỎI {idx + 1} ({q.type === "multiple_choice" ? "TRẮC NGHIỆM" : "TỰ LUẬN"}) · {q.points} ĐIỂM
                </span>
                {attempt?.status === "graded" && ans?.scoreAwarded !== undefined && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
                    Điểm đạt được: {ans.scoreAwarded} / {q.points}đ
                  </span>
                )}
              </div>

              <div style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, lineHeight: "1.5" }}>
                {q.content}
              </div>

              {/* Multiple Choice Options */}
              {q.type === "multiple_choice" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {q.options.map((opt) => {
                    const isSelected = selectedOptions[q.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                          background: isSelected ? "#f5f3ff" : "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: isLocked ? "default" : "pointer",
                          opacity: isLocked && !isSelected ? 0.6 : 1,
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          disabled={isLocked}
                          checked={isSelected}
                          onChange={() => setSelectedOptions({ ...selectedOptions, [q.id]: opt.id })}
                          style={{ cursor: isLocked ? "default" : "pointer" }}
                        />
                        <span style={{ fontSize: "12px", color: isSelected ? "#3730a3" : "#334155", fontWeight: isSelected ? 700 : 500 }}>
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                /* Essay Textarea */
                <div>
                  <textarea
                    rows={4}
                    disabled={isLocked}
                    value={essayTexts[q.id] || ""}
                    onChange={(e) => setEssayTexts({ ...essayTexts, [q.id]: e.target.value })}
                    placeholder="Nhập nội dung bài giải tự luận của bạn tại đây..."
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
                  {ans?.teacherFeedback && (
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#065f46", background: "#ecfdf5", padding: "6px 10px", borderRadius: "6px" }}>
                      💬 <strong>Nhận xét giáo viên:</strong> {ans.teacherFeedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
            <span style={{ color: "#d97706" }}><Icon name="alertTriangle" size={18} /></span>
            <div>
              <strong>Lưu ý quan trọng:</strong>
              <div style={{ marginTop: "2px", lineHeight: "1.4" }}>
                Sau khi bấm <strong>Xác nhận nộp</strong>, toàn bộ câu trả lời của bạn sẽ bị <strong>KHÓA CHỈ ĐỌC</strong> và gửi đến hệ thống chấm điểm. Bạn không thể hoàn tác hành động này.
              </div>
            </div>
          </div>

          {/* Answer Stats Summary */}
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
                <span style={{ color: "#334155" }}>Câu hỏi tự luận đã làm:</span>
                <strong style={{ color: "#4f46e5" }}>
                  {questions.filter((q) => q.type === "essay" && essayTexts[q.id]?.trim()).length} /{" "}
                  {questions.filter((q) => q.type === "essay").length} câu
                </strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              onClick={executeSubmit}
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
