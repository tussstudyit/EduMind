// ============================================================================
// EDUMIND AI - TEACHER QUIZ & QUESTION MANAGER (MODULE 6)
// Giáo viên tạo, sửa, xóa đề kiểm tra, ngân hàng câu hỏi & quản lý đáp án bảo mật
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Quiz, Question, QuestionType, QuestionOption } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

export function QuizManager() {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Modal tạo Quiz
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizCourseId, setQuizCourseId] = useState("course-01");
  const [quizTime, setQuizTime] = useState(15);
  const [quizPass, setQuizPass] = useState(5.0);

  // Modal tạo Câu hỏi
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [qContent, setQContent] = useState("");
  const [qType, setQType] = useState<QuestionType>("multiple_choice");
  const [qPoints, setQPoints] = useState(2.5);
  const [qExplanation, setQExplanation] = useState("");

  // Options trắc nghiệm
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOptIndex, setCorrectOptIndex] = useState(0);

  // Preview Mode
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});

  const loadQuizzes = () => {
    const list = storageService.getQuizzes();
    setQuizzes(list);
    if (list.length > 0 && !selectedQuiz) {
      setSelectedQuiz(list[0]);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      // Vì là Teacher nên được xem đáp án đúng (truyền "teacher")
      setQuestions(storageService.getQuestions(selectedQuiz.id, "teacher"));
    }
  }, [selectedQuiz]);

  const handleOpenCreateQuiz = () => {
    setQuizTitle("");
    setQuizCourseId("course-01");
    setQuizTime(15);
    setQuizPass(5.0);
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    const newQuiz = storageService.saveQuiz({
      title: quizTitle.trim(),
      courseId: quizCourseId,
      timeLimitMinutes: Number(quizTime),
      passingScore: Number(quizPass),
      maxScore: 10.0,
      isPublished: true,
    });

    success("Đã tạo đề kiểm tra mới", `Bài kiểm tra '${newQuiz.title}' đã sẵn sàng thêm câu hỏi.`);
    setIsQuizModalOpen(false);
    loadQuizzes();
    setSelectedQuiz(newQuiz);
  };

  const handleTogglePublish = (quiz: Quiz) => {
    storageService.saveQuiz({
      ...quiz,
      isPublished: !quiz.isPublished,
    });
    info(
      quiz.isPublished ? "Đã ẩn bài kiểm tra" : "Đã xuất bản bài kiểm tra",
      `Học viên ${quiz.isPublished ? "sẽ không thấy" : "đã có thể làm"} bài kiểm tra này.`
    );
    loadQuizzes();
    if (selectedQuiz?.id === quiz.id) {
      setSelectedQuiz({ ...selectedQuiz, isPublished: !quiz.isPublished });
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) {
      storageService.deleteQuiz(quizId);
      info("Đã xóa bài kiểm tra");
      loadQuizzes();
      setSelectedQuiz(null);
    }
  };

  // Question handlers
  const handleOpenCreateQ = () => {
    setQContent("");
    setQType("multiple_choice");
    setQPoints(2.5);
    setQExplanation("");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectOptIndex(0);
    setIsQModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !qContent.trim()) return;

    let options: QuestionOption[] = [];
    if (qType === "multiple_choice") {
      options = [
        { id: `opt-${Date.now()}-1`, text: optA.trim() || "Phương án A", isCorrect: correctOptIndex === 0 },
        { id: `opt-${Date.now()}-2`, text: optB.trim() || "Phương án B", isCorrect: correctOptIndex === 1 },
        { id: `opt-${Date.now()}-3`, text: optC.trim() || "Phương án C", isCorrect: correctOptIndex === 2 },
        { id: `opt-${Date.now()}-4`, text: optD.trim() || "Phương án D", isCorrect: correctOptIndex === 3 },
      ];
    }

    storageService.saveQuestion({
      quizId: selectedQuiz.id,
      content: qContent.trim(),
      type: qType,
      points: Number(qPoints),
      explanation: qExplanation.trim(),
      options,
    });

    success("Đã thêm câu hỏi vào đề thi");
    setIsQModalOpen(false);
    setQuestions(storageService.getQuestions(selectedQuiz.id, "teacher"));
    loadQuizzes();
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!selectedQuiz) return;
    if (confirm("Xóa câu hỏi này khỏi đề thi?")) {
      storageService.deleteQuestion(qId);
      info("Đã xóa câu hỏi");
      setQuestions(storageService.getQuestions(selectedQuiz.id, "teacher"));
      loadQuizzes();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 6: BÀI TẬP, BÀI KIỂM TRA & CÂU HỎI (TEACHER)</span>
          <h2>Ngân hàng Đề thi & Soạn thảo Đánh giá</h2>
        </div>
        <button
          onClick={handleOpenCreateQuiz}
          className="quick-action"
          style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
        >
          <span>+</span> Tạo đề kiểm tra mới
        </button>
      </div>

      {/* Security rule alert */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          fontSize: "11px",
          color: "#065f46",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ color: "#059669" }}><Icon name="shield" size={16} /></span>
        <span>
          <strong>Quy tắc bảo mật đề thi:</strong> Đáp án đúng chỉ hiển thị cho tài khoản Giáo viên/Admin. Khi học sinh làm bài, hệ thống tự động bóc tách và ẩn toàn bộ cờ <code>isCorrect</code>.
        </span>
      </div>

      {/* Main split: Quizzes on left, Question Bank on right */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Quizzes List */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "13px", color: "#1e293b" }}>Danh sách đề kiểm tra ({quizzes.length})</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quizzes.map((qz) => {
              const isSelected = selectedQuiz?.id === qz.id;
              return (
                <div
                  key={qz.id}
                  onClick={() => setSelectedQuiz(qz)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: isSelected ? "#f5f3ff" : "#f8fafc",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{qz.courseTitle}</span>
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: "3px",
                        fontSize: "8.5px",
                        fontWeight: 700,
                        background: qz.isPublished ? "#ecfdf5" : "#fee2e2",
                        color: qz.isPublished ? "#065f46" : "#dc2626",
                      }}
                    >
                      {qz.isPublished ? "XUẤT BẢN" : "ẨN"}
                    </span>
                  </div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#1e293b", margin: "4px 0" }}>
                    {qz.title}
                  </strong>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    ⏱️ {qz.timeLimitMinutes} phút · {qz.questionCount} câu hỏi · Điểm đạt: {qz.passingScore}đ
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Question Bank for selected quiz */}
        {selectedQuiz ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Quiz Banner */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>
                  KHÓA HỌC: {selectedQuiz.courseTitle}
                </span>
                <h2 style={{ margin: "4px 0", fontSize: "16px", color: "#1e293b" }}>{selectedQuiz.title}</h2>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Thời gian: {selectedQuiz.timeLimitMinutes} phút | Điểm tối đa: {selectedQuiz.maxScore}đ | Số câu hỏi: {questions.length}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setPreviewAnswers({});
                    setIsPreviewOpen(true);
                  }}
                  title="Xem trước giao diện làm bài của học sinh (Đáp án đúng được ẩn hoàn toàn)"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #c7d2fe",
                    background: "#eef2ff",
                    color: "#4338ca",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="eye" size={13} /> Xem trước (Student View)
                </button>
                <button
                  onClick={() => handleTogglePublish(selectedQuiz)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: selectedQuiz.isPublished ? "#fee2e2" : "#ecfdf5",
                    color: selectedQuiz.isPublished ? "#dc2626" : "#065f46",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {selectedQuiz.isPublished ? "Ẩn đề thi" : "Xuất bản đề thi"}
                </button>
                <button
                  onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #fee2e2",
                    background: "#fef2f2",
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="panel">
              <div className="panel-heading" style={{ marginBottom: "14px" }}>
                <div>
                  <span className="eyebrow">NGÂN HÀNG CÂU HỎI ({questions.length})</span>
                  <h2>Chi tiết câu hỏi & Lựa chọn đáp án</h2>
                </div>
                <button
                  onClick={handleOpenCreateQ}
                  className="quick-action"
                  style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
                >
                  <span>+</span> Thêm câu hỏi
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          Câu {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: q.type === "multiple_choice" ? "#f1f5f9" : "#fef3c7",
                            color: q.type === "multiple_choice" ? "#475569" : "#b45309",
                            fontWeight: 700,
                          }}
                        >
                          {q.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"} · {q.points}đ
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>

                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600, lineHeight: "1.45" }}>
                      {q.content}
                    </div>

                    {/* Multiple choice options preview */}
                    {q.type === "multiple_choice" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: opt.isCorrect ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                              background: opt.isCorrect ? "#ecfdf5" : "#ffffff",
                              fontSize: "11px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ color: opt.isCorrect ? "#065f46" : "#334155", fontWeight: opt.isCorrect ? 700 : 500 }}>
                              {opt.text}
                            </span>
                            {opt.isCorrect && (
                              <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 800 }}>
                                ✓ ĐÁP ÁN ĐÚNG
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div style={{ fontSize: "11px", color: "#64748b", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                        💡 <strong>Giải thích đáp án:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Add Quiz */}
      <Modal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        title="Tạo Đề Kiểm Tra Mới"
        subtitle="Thiết lập thời gian làm bài, điểm chuẩn qua môn và khóa học áp dụng."
      >
        <form onSubmit={handleSaveQuiz} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Tiêu đề bài kiểm tra *
            </label>
            <input
              type="text"
              required
              placeholder="Vd: Kiểm tra 15 phút: Cấu trúc rẽ nhánh & Vòng lặp"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Khóa học áp dụng
              </label>
              <select
                value={quizCourseId}
                onChange={(e) => setQuizCourseId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                {storageService.getCourses("teacher", currentUser.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                value={quizTime}
                onChange={(e) => setQuizTime(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsQuizModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Tạo bài kiểm tra
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Question */}
      <Modal
        isOpen={isQModalOpen}
        onClose={() => setIsQModalOpen(false)}
        title="Thêm Câu Hỏi Mới vào Đề Thi"
        subtitle="Hỗ trợ câu hỏi Trắc nghiệm nhiều lựa chọn hoặc Tự luận phân tích."
      >
        <form onSubmit={handleSaveQuestion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Dạng câu hỏi
              </label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value as QuestionType)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="multiple_choice">Trắc nghiệm (Tự động chấm)</option>
                <option value="essay">Tự luận (Giáo viên chấm điểm)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thang điểm
              </label>
              <input
                type="number"
                step="0.5"
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Nội dung câu hỏi *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nhập nội dung đề bài, có thể chèn code hoặc công thức..."
              value={qContent}
              onChange={(e) => setQContent(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          {/* Options if multiple choice */}
          {qType === "multiple_choice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                Các phương án lựa chọn & Chọn đáp án ĐÚNG (Radio):
              </label>
              {[
                { label: "A", val: optA, set: setOptA, idx: 0 },
                { label: "B", val: optB, set: setOptB, idx: 1 },
                { label: "C", val: optC, set: setOptC, idx: 2 },
                { label: "D", val: optD, set: setOptD, idx: 3 },
              ].map((opt) => (
                <div key={opt.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="radio"
                    name="correct-opt"
                    checked={correctOptIndex === opt.idx}
                    onChange={() => setCorrectOptIndex(opt.idx)}
                    style={{ cursor: "pointer" }}
                    title="Đánh dấu đây là đáp án đúng"
                  />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", width: "16px" }}>{opt.label}.</span>
                  <input
                    type="text"
                    placeholder={`Nội dung phương án ${opt.label}...`}
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Giải thích lời giải chi tiết
            </label>
            <input
              type="text"
              placeholder="Giải thích vì sao đáp án này đúng..."
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => setIsQModalOpen(false)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "12px", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              Lưu câu hỏi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Student Preview */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedQuiz ? `[Xem trước] ${selectedQuiz.title}` : "Xem trước đề thi"}
        subtitle="Mô phỏng trải nghiệm thực tế của học sinh. Dữ liệu câu hỏi được tự động loại bỏ đáp án đúng."
        maxWidth="760px"
      >
        {selectedQuiz && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Student Preview Alert */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                fontSize: "11.5px",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#d97706" }}><Icon name="eye" size={16} /></span>
              <span>
                <strong>Giao diện xem trước của học sinh:</strong> Đang hiển thị chính xác những gì học sinh sẽ thấy. Toàn bộ cờ <code>isCorrect</code> và phần giải thích đáp án được hệ thống giấu hoàn toàn.
              </span>
            </div>

            {/* Exam Simulation Top bar */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "13px", color: "#1e293b" }}>{selectedQuiz.title}</strong>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Thời gian: {selectedQuiz.timeLimitMinutes} phút · {questions.length} câu hỏi · Điểm chuẩn đạt: {selectedQuiz.passingScore}đ
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                <Icon name="clock" size={14} />
                <span>{selectedQuiz.timeLimitMinutes}:00</span>
              </div>
            </div>

            {/* Student Questions List (Safe mode) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
              {storageService.getQuestions(selectedQuiz.id, "student").map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1" }}>
                      CÂU HỎI {idx + 1} ({q.type === "multiple_choice" ? "TRẮC NGHIỆM" : "TỰ LUẬN"}) · {q.points} ĐIỂM
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600, lineHeight: "1.45" }}>
                    {q.content}
                  </div>

                  {q.type === "multiple_choice" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {q.options.map((opt) => {
                        const isChecked = previewAnswers[q.id] === opt.id;
                        return (
                          <label
                            key={opt.id}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "6px",
                              border: isChecked ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                              background: isChecked ? "#f5f3ff" : "#f8fafc",
                              fontSize: "11.5px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name={`preview-${q.id}`}
                              checked={isChecked}
                              onChange={() => setPreviewAnswers({ ...previewAnswers, [q.id]: opt.id })}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ color: isChecked ? "#4338ca" : "#334155", fontWeight: isChecked ? 700 : 500 }}>
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      placeholder="Học sinh sẽ nhập bài giải tự luận ở đây..."
                      value={previewAnswers[q.id] || ""}
                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đóng chế độ xem trước
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => info("Đây là bản xem trước", "Tính năng lưu nháp hoạt động bình thường trên tài khoản Học sinh.")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Lưu nháp (Mẫu)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    info("Đây là bản xem trước", "Khi học sinh bấm nộp bài thật, bài làm sẽ được khóa và chuyển về Trung tâm chấm điểm của bạn.");
                    setIsPreviewOpen(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Nộp bài thi (Mẫu)
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
