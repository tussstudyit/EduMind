// ============================================================================
// EDUMIND AI - TEACHER QUIZ & QUESTION MANAGER (MODULE 6 - LIVE POSTGRESQL DATA)
// Giáo viên tạo, sửa, xóa đề kiểm tra, ngân hàng câu hỏi, đánh dấu đáp án đúng,
// cấu hình chấm tự động & tải lên file đề bài tự luận kèm bản xem trực tiếp
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { Quiz, Question, QuestionType, QuestionOption, Course } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { QuizQuestionImporter } from "@/components/teacher/QuizQuestionImporter";
import {
  ImportedQuestionDraft,
  readAttachmentFile,
  UploadedAttachmentPayload,
} from "@/services/questionImportService";

export function QuizManager() {
  const { success, error, info } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Modal tạo / sửa cài đặt Quiz
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizCourseId, setQuizCourseId] = useState<string>("");
  const [quizTime, setQuizTime] = useState(15);
  const [quizPass, setQuizPass] = useState(5.0);
  const [quizMaxScore, setQuizMaxScore] = useState(10.0);

  // Modal tạo / sửa Câu hỏi
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isQuestionImportOpen, setIsQuestionImportOpen] = useState(false);
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

  // Đính kèm file đề bài tự luận (cho câu hỏi Essay)
  const [essayAttachment, setEssayAttachment] = useState<UploadedAttachmentPayload | null>(null);
  const [isReadingAttachment, setIsReadingAttachment] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<UploadedAttachmentPayload | null>(null);

  // Preview Mode
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});

  const loadQuizzes = async (preferredQuizId?: string) => {
    try {
      const [list, myCourses] = await Promise.all([
        apiClient.getQuizzes(),
        apiClient.getCourses().catch(() => []),
      ]);
      setQuizzes(list);
      setCourses(myCourses);
      const targetId = preferredQuizId ?? selectedQuiz?.id;
      const nextSelected = list.find((q) => q.id === targetId) || list[0] || null;
      setSelectedQuiz(nextSelected);
    } catch (err) {
      error("Không tải được danh sách đề thi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const loadQuestions = async (quizId: string) => {
    try {
      setQuestions(await apiClient.getQuestions(quizId, false));
    } catch {
      setQuestions([]);
    }
  };

  useEffect(() => {
    void loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      void loadQuestions(selectedQuiz.id);
    } else {
      setQuestions([]);
    }
  }, [selectedQuiz?.id]);

  const handleOpenCreateQuiz = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizDescription("");
    setQuizCourseId("");
    setQuizTime(15);
    setQuizPass(5.0);
    setQuizMaxScore(10.0);
    setIsQuizModalOpen(true);
  };

  const handleOpenEditQuizSettings = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description || "");
    setQuizCourseId(quiz.courseId || "");
    setQuizTime(quiz.timeLimitMinutes || 15);
    setQuizPass(quiz.passingScore || 5.0);
    setQuizMaxScore(quiz.maxScore > 0 ? quiz.maxScore : 10.0);
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    try {
      const linkedCourse = courses.find((c) => c.id === quizCourseId);
      if (editingQuizId) {
        const updated = await apiClient.updateQuiz(editingQuizId, {
          title: quizTitle.trim(),
          description: quizDescription.trim(),
          courseId: linkedCourse ? linkedCourse.id : null,
          courseTitle: linkedCourse ? linkedCourse.title : "Đề độc lập",
          timeLimitMinutes: Number(quizTime),
          passingScore: Number(quizPass),
          maxScore: Number(quizMaxScore) || 10.0,
        });
        success("Đã lưu cài đặt đề thi & chấm điểm", `Cập nhật thành công cho đề "${updated.title}".`);
        setIsQuizModalOpen(false);
        await loadQuizzes(updated.id);
      } else {
        const newQuiz = await apiClient.createQuiz({
          title: quizTitle.trim(),
          description: quizDescription.trim(),
          courseId: linkedCourse ? linkedCourse.id : null,
          courseTitle: linkedCourse ? linkedCourse.title : "Đề độc lập",
          timeLimitMinutes: Number(quizTime),
          passingScore: Number(quizPass),
          maxScore: Number(quizMaxScore) || 10.0,
          isPublished: false,
        });

        success("Đã tạo đề kiểm tra mới", `Bài kiểm tra '${newQuiz.title}' đã sẵn sàng thêm câu hỏi.`);
        setIsQuizModalOpen(false);
        await loadQuizzes(newQuiz.id);
      }
    } catch (err) {
      error("Không lưu được đề kiểm tra", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    if (!quiz.isPublished && questions.length === 0) {
      error("Chưa thể phát hành", "Vui lòng thêm ít nhất 1 câu hỏi vào đề thi trước khi phát hành cho sinh viên.");
      return;
    }
    try {
      const updated = await apiClient.updateQuiz(quiz.id, {
        isPublished: !quiz.isPublished,
      });
      info(
        updated.isPublished ? "🚀 Đã phát hành đề thi" : "Đã chuyển đề thi về Bản nháp (Ẩn)",
        `Sinh viên ${updated.isPublished ? "đã có thể vào làm" : "tạm thời không thấy"} bài kiểm tra này.`,
      );
      await loadQuizzes(updated.id);
    } catch (err) {
      error("Không cập nhật được trạng thái đề thi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) return;
    try {
      await apiClient.deleteQuiz(quizId);
      info("Đã xóa bài kiểm tra");
      setSelectedQuiz(null);
      await loadQuizzes();
    } catch (err) {
      error("Không xóa được đề thi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  // Question handlers
  const handleOpenCreateQ = () => {
    setEditingQuestionId(null);
    setQContent("");
    setQType("multiple_choice");
    setQPoints(Number((10 / Math.max(questions.length + 1, 1)).toFixed(2)) || 2.5);
    setQExplanation("");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectOptIndex(0);
    setEssayAttachment(null);
    setIsQModalOpen(true);
  };

  const handleOpenEditQ = (q: Question) => {
    setEditingQuestionId(q.id);
    setQContent(q.content);
    setQType(q.type);
    setQPoints(q.points);
    setQExplanation(q.explanation || "");
    if (q.type === "multiple_choice") {
      setOptA(q.options[0]?.text || "");
      setOptB(q.options[1]?.text || "");
      setOptC(q.options[2]?.text || "");
      setOptD(q.options[3]?.text || "");
      const foundCorrect = q.options.findIndex((o) => o.isCorrect);
      setCorrectOptIndex(foundCorrect >= 0 ? foundCorrect : 0);
      setEssayAttachment(null);
    } else {
      const fileOpt = q.options?.find((o) => o.attachmentName);
      if (fileOpt && fileOpt.attachmentName) {
        setEssayAttachment({
          attachmentName: fileOpt.attachmentName,
          attachmentType: fileOpt.attachmentType || "application/octet-stream",
          attachmentSize: fileOpt.attachmentSize || "",
          attachmentDataUrl: fileOpt.attachmentDataUrl || "",
          attachmentExtractedText: fileOpt.attachmentExtractedText || "",
        });
      } else {
        setEssayAttachment(null);
      }
    }
    setIsQModalOpen(true);
  };

  const handleEssayFileSelect = async (file?: File) => {
    if (!file) return;
    setIsReadingAttachment(true);
    try {
      const payload = await readAttachmentFile(file);
      setEssayAttachment(payload);
      if (!qContent.trim()) {
        setQContent(
          payload.attachmentExtractedText
            ? `Đề bài tự luận (${file.name}):\n${payload.attachmentExtractedText.slice(0, 600)}${payload.attachmentExtractedText.length > 600 ? "..." : ""}`
            : `Sinh viên xem file đề bài tự luận đính kèm "${file.name}", hoàn thành bài làm và tải file bài giải lên hệ thống.`,
        );
      }
      success("Đã đính kèm file đề tự luận", `Tệp "${file.name}" (${payload.attachmentSize}) đã sẵn sàng cho sinh viên xem trực tiếp trên web.`);
    } catch (err) {
      error("Không đọc được tệp đề bài", err instanceof Error ? err.message : "Vui lòng chọn tệp dưới 20MB.");
    } finally {
      setIsReadingAttachment(false);
    }
  };

  const handleQuickUploadEssayFileOnCard = async (q: Question, file?: File) => {
    if (!selectedQuiz || !file) return;
    try {
      const payload = await readAttachmentFile(file);
      await apiClient.updateQuestion(q.id, {
        options: [
          {
            id: q.options[0]?.id || `essay-file-${Date.now()}`,
            text: payload.attachmentName,
            isCorrect: false,
            ...payload,
          },
        ],
      });
      await loadQuestions(selectedQuiz.id);
      success("Đã tải lên file đề tự luận", `Sinh viên sẽ xem được tệp "${payload.attachmentName}" ngay trên web khi làm bài.`);
    } catch (err) {
      error("Không tải lên được file đề", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleQuickSetCorrectOption = async (q: Question, targetOptId: string) => {
    if (!selectedQuiz || q.type !== "multiple_choice") return;
    const nextOptions = q.options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === targetOptId,
    }));
    // Optimistic update
    setQuestions((prev) => prev.map((item) => (item.id === q.id ? { ...item, options: nextOptions } : item)));
    try {
      await apiClient.updateQuestion(q.id, { options: nextOptions });
      success("Đã cập nhật đáp án đúng", `Đã đổi đáp án đúng cho câu hỏi.`);
    } catch (err) {
      error("Không cập nhật được đáp án đúng", err instanceof Error ? err.message : "Vui lòng thử lại.");
      await loadQuestions(selectedQuiz.id);
    }
  };

  const handleDistributePointsScale10 = async () => {
    if (!selectedQuiz || questions.length === 0) return;
    const targetScale = selectedQuiz.maxScore > 0 ? selectedQuiz.maxScore : 10;
    const ptsEach = Number((targetScale / questions.length).toFixed(2));
    try {
      for (const q of questions) {
        await apiClient.updateQuestion(q.id, { points: ptsEach });
      }
      await loadQuestions(selectedQuiz.id);
      await loadQuizzes(selectedQuiz.id);
      success("Đã cân bằng thang điểm", `Mỗi câu hỏi được tính ${ptsEach} điểm (Tổng: ${(ptsEach * questions.length).toFixed(1)}đ).`);
    } catch (err) {
      error("Không thể chia đều điểm", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
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
    } else if (essayAttachment) {
      options = [
        {
          id: `essay-file-${Date.now()}`,
          text: essayAttachment.attachmentName,
          isCorrect: false,
          ...essayAttachment,
        },
      ];
    }

    try {
      if (editingQuestionId) {
        await apiClient.updateQuestion(editingQuestionId, {
          quizId: selectedQuiz.id,
          content: qContent.trim(),
          type: qType,
          points: Number(qPoints),
          explanation: qExplanation.trim(),
          options,
        });
        success("Đã cập nhật câu hỏi", "Nội dung, đáp án và tệp đính kèm đã được lưu.");
      } else {
        await apiClient.createQuestion({
          quizId: selectedQuiz.id,
          content: qContent.trim(),
          type: qType,
          points: Number(qPoints),
          explanation: qExplanation.trim(),
          options,
        });
        success("Đã thêm câu hỏi vào đề thi");
      }

      setIsQModalOpen(false);
      await loadQuestions(selectedQuiz.id);
      await loadQuizzes(selectedQuiz.id);
    } catch (err) {
      error("Không lưu được câu hỏi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleImportQuestions = async (drafts: ImportedQuestionDraft[], publishImmediately = false) => {
    if (!selectedQuiz || !drafts.length) return;
    try {
      for (const draft of drafts) {
        await apiClient.createQuestion({
          quizId: selectedQuiz.id,
          content: draft.content.trim(),
          type: draft.type,
          points: Number(draft.points) || 1,
          explanation: draft.explanation.trim(),
          options: draft.options.map((option) => ({
            id: `opt-${crypto.randomUUID()}`,
            text: option.text.trim(),
            isCorrect: option.label === draft.correctOptionLabel,
          })),
        });
      }
      if (publishImmediately) {
        await apiClient.updateQuiz(selectedQuiz.id, { isPublished: true });
      }
      await loadQuestions(selectedQuiz.id);
      await loadQuizzes(selectedQuiz.id);
      if (publishImmediately) {
        success(
          "🚀 Đã nhập câu hỏi & Phát hành đề thi!",
          `Đã thêm ${drafts.length} câu hỏi và phát hành đề "${selectedQuiz.title}" cho sinh viên làm bài.`,
        );
      } else {
        success("Đã thêm câu hỏi vào đề", `Đã nhập ${drafts.length} câu. Bạn có thể bấm trực tiếp vào từng đáp án để đổi đáp án đúng hoặc phát hành ngay.`);
      }
    } catch (err) {
      error("Không nhập được câu hỏi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedQuiz) return;
    if (!confirm("Xóa câu hỏi này khỏi đề thi?")) return;
    try {
      await apiClient.deleteQuestion(qId);
      info("Đã xóa câu hỏi");
      await loadQuestions(selectedQuiz.id);
      await loadQuizzes(selectedQuiz.id);
    } catch (err) {
      error("Không xóa được câu hỏi", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleOpenPreview = async () => {
    if (!selectedQuiz) return;
    setPreviewAnswers({});
    try {
      const safeQuestions = await apiClient.getQuestions(selectedQuiz.id, true);
      setPreviewQuestions(safeQuestions);
    } catch {
      setPreviewQuestions(
        questions.map((q) => ({
          ...q,
          explanation: undefined,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            ...(o.attachmentName
              ? {
                  attachmentName: o.attachmentName,
                  attachmentType: o.attachmentType,
                  attachmentSize: o.attachmentSize,
                  attachmentDataUrl: o.attachmentDataUrl,
                  attachmentExtractedText: o.attachmentExtractedText,
                }
              : {}),
          })),
        })),
      );
    }
    setIsPreviewOpen(true);
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

      {/* Security & workflow banner */}
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
          <strong>Quy trình ra đề & chấm điểm:</strong> (1) Gõ hoặc tải file đề để xem trước, tích chọn đáp án đúng và chỉnh sửa; (2) Cài đặt thời gian, điểm đạt chuẩn để hệ thống tự động chấm trắc nghiệm; (3) Với bài tự luận, đính kèm file đề để sinh viên xem trên web và nộp file bài làm về cho giảng viên chấm trực tuyến.
        </span>
      </div>

      {/* Main split: Quizzes on left, Question Bank on right */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Quizzes List */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <strong style={{ fontSize: "13px", color: "#1e293b" }}>Danh sách đề kiểm tra ({quizzes.length})</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quizzes.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                Chưa có đề kiểm tra nào. Bấm &quot;+ Tạo đề kiểm tra mới&quot; để tạo.
              </div>
            ) : (
              quizzes.map((qz) => {
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
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>{qz.courseId ? qz.courseTitle : "ĐỀ ĐỘC LẬP"}</span>
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
                        {qz.isPublished ? "ĐÃ PHÁT HÀNH" : "BẢN NHÁP"}
                      </span>
                    </div>
                    <strong style={{ display: "block", fontSize: "12px", color: "#1e293b", margin: "4px 0" }}>
                      {qz.title}
                    </strong>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                      ⏱️ {qz.timeLimitMinutes} phút · {qz.questionCount} câu · Điểm đạt: <strong>{qz.passingScore}/{qz.maxScore}đ</strong>
                    </div>
                  </div>
                );
              })
            )}
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
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1" }}>
                    {selectedQuiz.courseId ? `KHÓA HỌC: ${selectedQuiz.courseTitle}` : "ĐỀ KIỂM TRA ĐỘC LẬP"}
                  </span>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 800,
                      background: selectedQuiz.isPublished ? "#ecfdf5" : "#fef3c7",
                      color: selectedQuiz.isPublished ? "#065f46" : "#b45309",
                    }}
                  >
                    {selectedQuiz.isPublished ? "● ĐANG PHÁT HÀNH CHO SINH VIÊN" : "● ĐANG Ở CHẾ ĐỘ SOẠN THẢO / XEM TRƯỚC"}
                  </span>
                </div>
                <h2 style={{ margin: "4px 0", fontSize: "16px", color: "#1e293b" }}>{selectedQuiz.title}</h2>
                <div style={{ fontSize: "11.5px", color: "#475569", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <span>⏱️ Thời gian: <strong>{selectedQuiz.timeLimitMinutes} phút</strong></span>
                  <span>🎯 Điểm đạt chuẩn: <strong>{selectedQuiz.passingScore}đ</strong></span>
                  <span>🏆 Tổng điểm tối đa: <strong>{selectedQuiz.maxScore}đ</strong></span>
                  <span>📋 Số câu hỏi: <strong>{questions.length} câu</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleOpenEditQuizSettings(selectedQuiz)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#334155",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ⚙️ Cài đặt chấm điểm
                </button>
                <button
                  onClick={handleOpenPreview}
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
                  <Icon name="eye" size={13} /> Xem trước (SV)
                </button>
                <button
                  onClick={() => handleTogglePublish(selectedQuiz)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: selectedQuiz.isPublished ? "1px solid #fca5a5" : "1px solid #059669",
                    background: selectedQuiz.isPublished ? "#fee2e2" : "linear-gradient(135deg, #059669, #10b981)",
                    color: selectedQuiz.isPublished ? "#dc2626" : "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {selectedQuiz.isPublished ? "Tạm ẩn đề thi" : "🚀 Phát hành đề thi"}
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
                  <span className="eyebrow">NGÂN HÀNG CÂU HỎI & BẢN XEM TRƯỚC ĐÁP ÁN ({questions.length})</span>
                  <h2>Chi tiết câu hỏi, Đánh dấu câu đúng & Đề bài tự luận</h2>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleDistributePointsScale10()}
                      className="quick-action"
                      style={{ cursor: "pointer", background: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                    >
                      ⚖️ Chia đều thang 10đ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsQuestionImportOpen(true)}
                    className="quick-action"
                    style={{ cursor: "pointer", background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}
                  >
                    <Icon name="upload" size={14} /> Tự gõ / Upload file đề (Xem trước & Chấm tự động)
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateQ}
                    className="quick-action"
                    style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
                  >
                    <span>+</span> Thêm câu hỏi / Đề tự luận
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {questions.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                    Đề thi chưa có câu hỏi nào. Hãy bấm <strong>&quot;Tự gõ / Upload file đề&quot;</strong> để hệ thống tự tách bản xem trước câu hỏi &amp; đáp án, hoặc bấm <strong>&quot;+ Thêm câu hỏi / Đề tự luận&quot;</strong>.
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const essayFileOpt = q.type === "essay" ? q.options?.find((o) => o.attachmentName) : undefined;
                    return (
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: q.type === "multiple_choice" ? "#e0f2fe" : "#fef3c7",
                                color: q.type === "multiple_choice" ? "#0369a1" : "#b45309",
                                fontWeight: 700,
                              }}
                            >
                              {q.type === "multiple_choice" ? "Trắc nghiệm (Tự động chấm)" : "Tự luận (Nộp bài & Giảng viên chấm)"} · {q.points}đ
                            </span>
                            {q.type === "multiple_choice" && (
                              <span style={{ fontSize: "10px", color: "#64748b" }}>
                                (Bấm vào phương án bất kỳ để đổi Đáp án đúng)
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditQ(q)}
                              style={{
                                padding: "4px 9px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#334155",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ✏️ Sửa câu hỏi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #fee2e2",
                                background: "#fef2f2",
                                color: "#ef4444",
                                cursor: "pointer",
                              }}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                          {q.content}
                        </div>

                        {/* Multiple choice options preview with 1-click correct answer toggle */}
                        {q.type === "multiple_choice" && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
                            {q.options.map((opt, optIdx) => {
                              const optLabel = String.fromCharCode(65 + optIdx);
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => void handleQuickSetCorrectOption(q, opt.id)}
                                  title="Bấm để đánh dấu đây là Đáp án đúng"
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: "6px",
                                    border: opt.isCorrect ? "2px solid #10b981" : "1px solid #e2e8f0",
                                    background: opt.isCorrect ? "#ecfdf5" : "#ffffff",
                                    fontSize: "11.5px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.12s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <input
                                      type="radio"
                                      checked={!!opt.isCorrect}
                                      onChange={() => void handleQuickSetCorrectOption(q, opt.id)}
                                      style={{ cursor: "pointer", accentColor: "#059669" }}
                                    />
                                    <span style={{ color: opt.isCorrect ? "#065f46" : "#334155", fontWeight: opt.isCorrect ? 700 : 500 }}>
                                      <strong>{optLabel}.</strong> {opt.text}
                                    </span>
                                  </div>
                                  {opt.isCorrect && (
                                    <span style={{ color: "#047857", background: "#a7f3d0", padding: "2px 6px", borderRadius: 4, fontSize: "9.5px", fontWeight: 800, whiteSpace: "nowrap" }}>
                                      ✓ ĐÁP ÁN ĐÚNG
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Essay exam file section for Essay questions */}
                        {q.type === "essay" && (
                          <div
                            style={{
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Icon name="fileText" size={16} />
                              {essayFileOpt?.attachmentName ? (
                                <div style={{ fontSize: "11.5px", color: "#92400e" }}>
                                  <strong>Đề bài tự luận đính kèm:</strong> {essayFileOpt.attachmentName}{" "}
                                  {essayFileOpt.attachmentSize ? `(${essayFileOpt.attachmentSize})` : ""}
                                </div>
                              ) : (
                                <div style={{ fontSize: "11px", color: "#92400e" }}>
                                  Chưa đính kèm file đề bài tự luận (PDF, DOCX, Ảnh, TXT). Sinh viên sẽ đọc nội dung câu hỏi ở trên hoặc xem file đề bạn tải lên.
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {essayFileOpt?.attachmentName && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewingAttachment({
                                      attachmentName: essayFileOpt.attachmentName!,
                                      attachmentType: essayFileOpt.attachmentType || "application/octet-stream",
                                      attachmentSize: essayFileOpt.attachmentSize || "",
                                      attachmentDataUrl: essayFileOpt.attachmentDataUrl || "",
                                      attachmentExtractedText: essayFileOpt.attachmentExtractedText || "",
                                    })
                                  }
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #f59e0b",
                                    background: "#ffffff",
                                    color: "#b45309",
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  👁️ Xem đề trên Web
                                </button>
                              )}
                              <label
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #d97706",
                                  background: "#d97706",
                                  color: "#ffffff",
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                📎 {essayFileOpt?.attachmentName ? "Đổi file đề tự luận" : "Upload file đề tự luận"}
                                <input
                                  type="file"
                                  accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                                  onChange={(e) => void handleQuickUploadEssayFileOnCard(q, e.target.files?.[0])}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div style={{ fontSize: "11px", color: "#64748b", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                            💡 <strong>Giải thích / Hướng dẫn chấm:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel" style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            Chọn hoặc tạo mới một đề kiểm tra ở cột bên trái để thêm câu hỏi và xuất bản cho học viên.
          </div>
        )}
      </div>

      {/* Modal Add / Edit Quiz Settings */}
      <Modal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        title={editingQuizId ? "Cài Đặt Đề Thi & Tiêu Chí Chấm Điểm Tự Động" : "Tạo Đề Kiểm Tra Mới"}
        subtitle="Hệ thống sẽ dựa trên Thời gian, Thang điểm tối đa và Điểm chuẩn đạt để chấm điểm tự động khi sinh viên nộp bài."
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

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Mô tả / Hướng dẫn làm bài cho sinh viên
            </label>
            <textarea
              rows={2}
              placeholder="Vd: Sinh viên làm trắc nghiệm trực tiếp hoặc xem file đề tự luận đính kèm và nộp bài giải..."
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Phạm vi khóa học áp dụng
            </label>
            <select
              value={quizCourseId}
              onChange={(e) => setQuizCourseId(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
            >
              <option value="">Đề độc lập (Tất cả học viên đều thấy khi xuất bản)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  Khóa học: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thời gian (Phút)
              </label>
              <input
                type="number"
                min={1}
                value={quizTime}
                onChange={(e) => setQuizTime(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Điểm đạt chuẩn (Đạt)
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={quizPass}
                onChange={(e) => setQuizPass(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Thang điểm tối đa
              </label>
              <input
                type="number"
                min={1}
                step="0.5"
                value={quizMaxScore}
                onChange={(e) => setQuizMaxScore(Number(e.target.value))}
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
              {editingQuizId ? "Lưu cài đặt đề thi" : "Tạo bài kiểm tra"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Question */}
      <Modal
        isOpen={isQModalOpen}
        onClose={() => setIsQModalOpen(false)}
        title={editingQuestionId ? "Chỉnh Sửa Câu Hỏi & Đáp Án" : "Thêm Câu Hỏi Mới / Đề Tự Luận"}
        subtitle="Hỗ trợ câu hỏi Trắc nghiệm chấm tự động hoặc Tự luận có kèm file đề bài cho sinh viên xem trực tiếp."
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
                <option value="multiple_choice">Trắc nghiệm (Hệ thống tự động chấm)</option>
                <option value="essay">Tự luận (Upload file đề & Giảng viên chấm trên web)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Điểm số của câu này
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Nội dung câu hỏi / Yêu cầu đề bài *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nhập nội dung câu hỏi hoặc yêu cầu bài tự luận..."
              value={qContent}
              onChange={(e) => setQContent(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
          </div>

          {/* Options if multiple choice */}
          {qType === "multiple_choice" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                Các phương án lựa chọn &amp; Tích chọn đáp án ĐÚNG (Radio):
              </label>
              {[
                { label: "A", val: optA, set: setOptA, idx: 0 },
                { label: "B", val: optB, set: setOptB, idx: 1 },
                { label: "C", val: optC, set: setOptC, idx: 2 },
                { label: "D", val: optD, set: setOptD, idx: 3 },
              ].map((opt) => (
                <div
                  key={opt.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: correctOptIndex === opt.idx ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                    background: correctOptIndex === opt.idx ? "#ecfdf5" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="correct-opt"
                    checked={correctOptIndex === opt.idx}
                    onChange={() => setCorrectOptIndex(opt.idx)}
                    style={{ cursor: "pointer", accentColor: "#059669" }}
                    title="Đánh dấu đây là đáp án đúng"
                  />
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: correctOptIndex === opt.idx ? "#047857" : "#64748b", width: "18px" }}>
                    {opt.label}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Nội dung phương án ${opt.label}...`}
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  />
                  {correctOptIndex === opt.idx && (
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#047857", whiteSpace: "nowrap" }}>
                      ✓ ĐÁP ÁN ĐÚNG
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px dashed #f59e0b",
                background: "#fffbeb",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label style={{ fontSize: "11.5px", fontWeight: 800, color: "#92400e" }}>
                📎 Tải lên file Đề bài tự luận cho sinh viên xem trên Web (PDF, DOCX, Ảnh, TXT):
              </label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#78350f" }}>
                  {isReadingAttachment
                    ? "Đang xử lý tệp đề bài..."
                    : essayAttachment
                    ? `Đã đính kèm: ${essayAttachment.attachmentName} (${essayAttachment.attachmentSize})`
                    : "Chưa chọn tệp đính kèm (Không bắt buộc nếu đã gõ đề bài ở ô trên)"}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {essayAttachment && (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewingAttachment(essayAttachment)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "1px solid #d97706",
                          background: "#fff",
                          color: "#b45309",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        👁️ Xem trước
                      </button>
                      <button
                        type="button"
                        onClick={() => setEssayAttachment(null)}
                        style={{
                          padding: "5px 9px",
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
                    </>
                  )}
                  <label
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "#d97706",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📤 Chọn file đề bài
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                      onChange={(e) => void handleEssayFileSelect(e.target.files?.[0])}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Giải thích đáp án / Hướng dẫn &amp; Biểu điểm chấm tự luận
            </label>
            <input
              type="text"
              placeholder="Giải thích vì sao đáp án này đúng hoặc tiêu chí chấm tự luận..."
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
              {editingQuestionId ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </button>
          </div>
        </form>
      </Modal>

      <QuizQuestionImporter
        isOpen={isQuestionImportOpen}
        onClose={() => setIsQuestionImportOpen(false)}
        onImport={handleImportQuestions}
      />

      {/* Modal Xem trực tiếp file đề bài tự luận ngay trên Web */}
      <Modal
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        title={viewingAttachment ? `📄 Xem trực tiếp: ${viewingAttachment.attachmentName}` : "Xem tài liệu"}
        subtitle="Bản xem trực tiếp trên trình duyệt (Web Preview)"
        maxWidth="840px"
      >
        {viewingAttachment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                📎 {viewingAttachment.attachmentName} {viewingAttachment.attachmentSize ? `(${viewingAttachment.attachmentSize})` : ""}
              </span>
              {viewingAttachment.attachmentDataUrl && (
                <a
                  href={viewingAttachment.attachmentDataUrl}
                  download={viewingAttachment.attachmentName}
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

            {viewingAttachment.attachmentDataUrl.startsWith("data:image/") ? (
              <div style={{ textAlign: "center", background: "#0f172a", padding: 12, borderRadius: 8 }}>
                <img
                  src={viewingAttachment.attachmentDataUrl}
                  alt={viewingAttachment.attachmentName}
                  style={{ maxWidth: "100%", maxHeight: "480px", borderRadius: 6 }}
                />
              </div>
            ) : viewingAttachment.attachmentDataUrl.startsWith("data:application/pdf") ? (
              <iframe
                src={viewingAttachment.attachmentDataUrl}
                title={viewingAttachment.attachmentName}
                style={{ width: "100%", height: "480px", border: "1px solid #cbd5e1", borderRadius: 8 }}
              />
            ) : null}

            {viewingAttachment.attachmentExtractedText && (
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
                  NỘI DUNG VĂN BẢN TRÍCH XUẤT TRỰC TIẾP TRÊN WEB:
                </div>
                {viewingAttachment.attachmentExtractedText}
              </div>
            )}
          </div>
        )}
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
                  Thời gian: {selectedQuiz.timeLimitMinutes} phút · {previewQuestions.length} câu hỏi · Điểm chuẩn đạt: {selectedQuiz.passingScore}đ
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

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
              {previewQuestions.map((q, idx) => {
                const essayFile = q.type === "essay" ? q.options?.find((o) => o.attachmentName) : undefined;
                return (
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

                    <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600, lineHeight: "1.45", whiteSpace: "pre-wrap" }}>
                      {q.content}
                    </div>

                    {essayFile?.attachmentName && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11.5, color: "#92400e", fontWeight: 700 }}>
                          📎 Đề bài đính kèm: {essayFile.attachmentName}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setViewingAttachment({
                              attachmentName: essayFile.attachmentName!,
                              attachmentType: essayFile.attachmentType || "application/octet-stream",
                              attachmentSize: essayFile.attachmentSize || "",
                              attachmentDataUrl: essayFile.attachmentDataUrl || "",
                              attachmentExtractedText: essayFile.attachmentExtractedText || "",
                            })
                          }
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d97706", background: "#fff", color: "#b45309", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          👁️ Xem đề bài trên Web
                        </button>
                      </div>
                    )}

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
                        placeholder="Học sinh sẽ nhập bài giải tự luận hoặc tải file bài làm lên tại đây..."
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
                );
              })}
            </div>

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
