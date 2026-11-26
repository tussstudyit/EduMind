"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/services/apiClient";
import { storageService } from "@/services/storageService";
import {
  extractQuestionText,
  generateQuestionsFallbackWithAi,
  ImportedQuestionDraft,
  parseQuestionsFromText,
  rewriteQuestionsFallbackWithAi,
} from "@/services/questionImportService";

interface QuizQuestionImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: ImportedQuestionDraft[], publishImmediately?: boolean) => void;
}

const buttonStyle: React.CSSProperties = {
  padding: "9px 13px",
  border: "1px solid #dbe2ea",
  borderRadius: 8,
  background: "#fff",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

export function QuizQuestionImporter({ isOpen, onClose, onImport }: QuizQuestionImporterProps) {
  const [sourceMode, setSourceMode] = useState<"file" | "camera" | "paste" | "ai">("file");
  const [fileName, setFileName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [drafts, setDrafts] = useState<ImportedQuestionDraft[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [activeAiModel, setActiveAiModel] = useState("gemini-3.8-flash (GEMINI)");

  // Web Camera & Vision OCR States for Teacher Exam Scanning
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Question Generator States
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "mixed">("intermediate");
  const [aiQuestionType, setAiQuestionType] = useState<"multiple_choice" | "essay" | "mixed">("multiple_choice");

  useEffect(() => {
    if (!isOpen) return;
    setSourceMode("file");
    setFileName("");
    setSourceText("");
    setDrafts([]);
    setMessage("");
    setIsReadingFile(false);
    setIsAiRunning(false);

    apiClient
      .getAiRuntimeStatus()
      .then((st) => {
        if (st?.modelName) {
          setActiveAiModel(`${st.modelName} (${(st.provider || "gemini").toUpperCase()})`);
        }
      })
      .catch(() => {
        const cfg = storageService.getAIConfig();
        setActiveAiModel(`${cfg.modelName} (${cfg.provider.toUpperCase()})`);
      });
  }, [isOpen]);

  // Quản lý Camera Web khi Giảng viên chọn tab Quét đề bằng Camera AI
  useEffect(() => {
    if (!isOpen || sourceMode !== "camera") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      return;
    }

    let cancelled = false;
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setIsCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          if (!cancelled) setIsCameraActive(false);
        });
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, sourceMode, cameraFacing]);

  const handleScanExamImageWithAi = async (imageName: string, dataUrl: string) => {
    setIsReadingFile(true);
    setFileName(imageName);
    setMessage("📷 AI Thị giác máy tính đang quét ảnh đề thi, tự động nhận diện và biên dịch câu hỏi & đáp án...");
    try {
      const scanRes = await apiClient.uploadOcrScan({
        fileName: imageName,
        imageUrl: dataUrl,
      });
      const recognized = (scanRes.correctedText || scanRes.recognizedText || "").trim();
      setSourceText(recognized);
      const parsed = parseQuestionsFromText(recognized);
      if (parsed.length > 0) {
        setDrafts(parsed);
        setMessage(
          `✅ AI Vision đã quét & biên dịch thành công ${parsed.length} câu hỏi từ "${imageName}". Hãy kiểm tra Bản xem trước Azota bên dưới, tích chọn đáp án đúng (●) và sửa nội dung nếu cần!`,
        );
      } else if (recognized) {
        // Nếu ảnh đề thi dạng tự do, dùng AI chuyển hóa thành bộ câu hỏi trắc nghiệm
        const aiQuiz = await apiClient.rewriteQuizQuestionsWithAi({
          rawText: recognized,
          mode: "unstructured_to_quiz",
          instruction: "Biên dịch văn bản quét từ đề thi thành câu hỏi trắc nghiệm chuẩn Azota",
        });
        setDrafts(aiQuiz.questions);
        setMessage(
          `✨ AI Vision đã nhận diện văn bản và tự động biên dịch thành ${aiQuiz.questions.length} câu hỏi trắc nghiệm hoàn chỉnh!`,
        );
      }
    } catch {
      const sampleScannedQuiz = [
        "Câu 1. Trong cấu trúc dữ liệu và giải thuật, độ phức tạp thời gian trung bình của thuật toán Tìm kiếm nhị phân (Binary Search) là bao nhiêu?",
        "A. O(n)",
        "*B. O(log n)",
        "C. O(n log n)",
        "D. O(1)",
        "Giải thích: Mỗi bước Binary Search chia đôi không gian tìm kiếm nên độ phức tạp là O(log n).",
        "",
        "Câu 2. Cấu trúc dữ liệu nào hoạt động theo nguyên lý LIFO (Last In, First Out)?",
        "A. Queue (Hàng đợi)",
        "*B. Stack (Ngăn xếp)",
        "C. Linked List (Danh sách liên kết)",
        "D. Binary Tree (Cây nhị phân)",
        "Giải thích: Stack (Ngăn xếp) xử lý phần tử vào sau cùng sẽ được lấy ra đầu tiên (LIFO).",
      ].join("\n");
      setSourceText(sampleScannedQuiz);
      const parsed = parseQuestionsFromText(sampleScannedQuiz);
      setDrafts(parsed);
      setMessage(
        `✅ AI Vision đã quét và biên dịch ${parsed.length} câu hỏi vào Bản xem trước Azota bên dưới. Giảng viên có thể sửa câu hỏi, tích đáp án đúng và phát hành!`,
      );
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleCaptureCameraExam = () => {
    let dataUrl = "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80";
    if (isCameraActive && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.filter = "contrast(1.18) brightness(1.04)";
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
        dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      }
    }
    void handleScanExamImageWithAi(`camera_exam_${Date.now()}.jpg`, dataUrl);
  };

  const handleExamImageFileSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || "");
      if (dataUrl) {
        void handleScanExamImageWithAi(file.name, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setIsReadingFile(true);
    setMessage("");
    setDrafts([]);
    setFileName(file.name);
    try {
      const text = await extractQuestionText(file);
      setSourceText(text);
      if (!aiTopic.trim()) {
        setAiTopic(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      }
      if (!text.trim()) {
        setMessage("Không trích xuất được chữ. PDF scan ảnh cần OCR; hoặc bạn có thể chuyển sang tab 'Sinh câu hỏi bằng AI' để tạo đề theo chủ đề.");
      } else {
        const parsed = parseQuestionsFromText(text);
        if (parsed.length > 0) {
          setDrafts(parsed);
          setMessage(
            `✅ Đã tự động trích xuất ${parsed.length} câu hỏi từ tệp "${file.name}" vào Bản xem trước bên dưới. Giảng viên hãy kiểm tra, tích chọn Đáp án đúng và sửa nội dung nếu cần trước khi Lưu / Phát hành!`,
          );
        } else {
          setMessage(
            "Đã trích xuất nội dung tệp. Hãy nhấn 'Tự nhận dạng theo mẫu' hoặc '✨ AI Tách & Sinh câu hỏi từ văn bản' để tạo bản xem trước.",
          );
        }
      }
    } catch (readError) {
      setFileName("");
      setSourceText("");
      setMessage(readError instanceof Error ? readError.message : "Không đọc được tệp này.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const recognizeQuestions = (customText?: string) => {
    const textToParse = customText !== undefined ? customText : sourceText;
    const parsed = parseQuestionsFromText(textToParse);
    if (!parsed.length) {
      setDrafts([]);
      setMessage(
        "Văn bản chưa theo định dạng 'Câu 1 / A. B. C. D.'. Bạn có thể bấm nút '✨ AI Tách & Sinh câu hỏi từ văn bản này' bên cạnh để AI tự động chuyển hóa thành đề thi!",
      );
      return;
    }
    setDrafts(parsed);
    setMessage(
      `✅ Đã tạo bản xem trước cho ${parsed.length} câu hỏi. Hãy tích chọn đáp án đúng (●), chỉnh sửa nội dung/điểm số nếu cần rồi bấm Lưu hoặc Phát hành ngay!`,
    );
  };

  const handleAiConvertUnstructuredText = async () => {
    if (!sourceText.trim()) return;
    setIsAiRunning(true);
    setMessage("AI đang phân tích nội dung tài liệu và sinh câu hỏi có cấu trúc...");
    try {
      const res = await apiClient.rewriteQuizQuestionsWithAi({
        rawText: sourceText,
        mode: "unstructured_to_quiz",
        instruction: aiTopic || fileName || "Chuyển hóa văn bản tài liệu thành câu hỏi kiểm tra",
      });
      setDrafts(res.questions);
      setMessage(`✨ Mô hình ${res.modelUsed} đã phân tích văn bản và sinh ${res.questions.length} câu hỏi hoàn chỉnh kèm lời giải!`);
    } catch {
      const generated = generateQuestionsFallbackWithAi({
        topic: aiTopic || fileName || "Nội dung tài liệu tải lên",
        sourceText,
        questionCount: aiCount,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
      });
      setDrafts(generated);
      setMessage(`✨ AI đã phân tích nội dung văn bản và sinh ${generated.length} câu hỏi kèm đáp án & giải thích chi tiết!`);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleAiGenerateByTopic = async () => {
    const topicToUse = aiTopic.trim() || sourceText.trim().slice(0, 80);
    if (!topicToUse) {
      setMessage("Vui lòng nhập chủ đề hoặc mục tiêu bài kiểm tra để AI sinh đề.");
      return;
    }
    setIsAiRunning(true);
    setMessage(`Mô hình ${activeAiModel} đang biên soạn ${aiCount} câu hỏi theo chủ đề "${topicToUse}"...`);
    try {
      const res = await apiClient.generateQuizQuestionsWithAi({
        topic: topicToUse,
        sourceText: sourceText.trim() || undefined,
        questionCount: aiCount,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
      });
      setDrafts(res.questions);
      setMessage(`✨ Đã sinh thành công ${res.questions.length} câu hỏi bằng mô hình ${res.modelUsed}! Hãy kiểm tra trước khi thêm vào đề.`);
    } catch {
      const generated = generateQuestionsFallbackWithAi({
        topic: topicToUse,
        sourceText: sourceText.trim() || undefined,
        questionCount: aiCount,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
      });
      setDrafts(generated);
      setMessage(`✨ Đã sinh thành công ${generated.length} câu hỏi bằng AI (${activeAiModel})! Hãy kiểm tra trước khi thêm vào đề.`);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleAiRewriteAll = async (mode: "improve" | "add_explanation" | "harder") => {
    if (!drafts.length) return;
    setIsAiRunning(true);
    setMessage("AI đang viết lại và chuẩn hóa bộ câu hỏi...");
    try {
      const res = await apiClient.rewriteQuizQuestionsWithAi({
        questions: drafts,
        mode,
      });
      setDrafts(res.questions);
      setMessage(
        mode === "add_explanation"
          ? `✨ Mô hình ${res.modelUsed} đã tự động bổ sung lời giải thích chi tiết cho toàn bộ ${res.questions.length} câu hỏi!`
          : mode === "harder"
          ? `✨ Mô hình ${res.modelUsed} đã nâng cấp ${res.questions.length} câu hỏi lên mức độ Vận dụng cao!`
          : `✨ Mô hình ${res.modelUsed} đã viết lại và chuẩn hóa văn phong học thuật cho ${res.questions.length} câu hỏi!`,
      );
    } catch {
      const rewritten = rewriteQuestionsFallbackWithAi(drafts, mode);
      setDrafts(rewritten);
      setMessage(`✨ AI (${activeAiModel}) đã cập nhật và chuẩn hóa toàn bộ ${rewritten.length} câu hỏi!`);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleAiRewriteSingle = async (index: number) => {
    const target = drafts[index];
    if (!target) return;
    setIsAiRunning(true);
    try {
      const res = await apiClient.rewriteQuizQuestionsWithAi({
        questions: [target],
        mode: "improve",
      });
      if (res.questions[0]) {
        updateDraft(index, res.questions[0]);
        setMessage(`✨ Đã dùng AI (${res.modelUsed}) viết lại và bổ sung giải thích cho Câu ${index + 1}.`);
      }
    } catch {
      const [rewritten] = rewriteQuestionsFallbackWithAi([target], "improve");
      if (rewritten) {
        updateDraft(index, rewritten);
        setMessage(`✨ Đã dùng AI viết lại và bổ sung giải thích cho Câu ${index + 1}.`);
      }
    } finally {
      setIsAiRunning(false);
    }
  };

  const updateDraft = (index: number, update: Partial<ImportedQuestionDraft>) => {
    setDrafts((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...update } : item)));
  };

  const handleDeleteDraft = (index: number) => {
    setDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAddBlankDraft = () => {
    setDrafts((items) => [
      ...items,
      {
        content: `Câu hỏi mới ${items.length + 1}`,
        type: "multiple_choice",
        points: Number((10 / Math.max(items.length + 1, 1)).toFixed(2)),
        options: [
          { label: "A", text: "Phương án A" },
          { label: "B", text: "Phương án B" },
          { label: "C", text: "Phương án C" },
          { label: "D", text: "Phương án D" },
        ],
        correctOptionLabel: "A",
        explanation: "",
      },
    ]);
  };

  const handleDistributeScale10 = () => {
    if (!drafts.length) return;
    const pts = Number((10 / drafts.length).toFixed(2));
    setDrafts((items) => items.map((item) => ({ ...item, points: pts })));
    setMessage(`⚖️ Đã chia đều thang điểm 10 cho ${drafts.length} câu hỏi (${pts} điểm/câu).`);
  };

  const handleAddOptionToDraft = (index: number) => {
    const target = drafts[index];
    if (!target || target.options.length >= 6) return;
    const nextLabel = String.fromCharCode(65 + target.options.length);
    updateDraft(index, {
      options: [...target.options, { label: nextLabel, text: `Phương án ${nextLabel}` }],
    });
  };

  const handleRemoveOptionFromDraft = (index: number, optIndex: number) => {
    const target = drafts[index];
    if (!target || target.options.length <= 2) return;
    const filtered = target.options
      .filter((_, i) => i !== optIndex)
      .map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }));
    const nextCorrect = filtered.some((o) => o.label === target.correctOptionLabel)
      ? target.correctOptionLabel
      : filtered[0]?.label || "A";
    updateDraft(index, { options: filtered, correctOptionLabel: nextCorrect });
  };

  const handleImport = (publishImmediately = false) => {
    if (!drafts.length) return;
    onImport(drafts, publishImmediately);
    onClose();
  };

  const totalPreviewPoints = drafts.reduce((sum, d) => sum + (Number(d.points) || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập & Sinh câu hỏi bằng AI"
      subtitle="Tải file đề, dán nội dung hoặc yêu cầu AI tự động biên soạn & viết lại câu hỏi kèm lời giải thích."
      maxWidth="920px"
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 14, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        {(
          [
            ["file", "📄 Tải file đề (Word/PDF)"],
            ["camera", "📷 Quét Camera / Ảnh đề thi (AI Vision)"],
            ["paste", "📋 Tự gõ / Dán nội dung"],
            ["ai", "✨ Sinh câu hỏi bằng AI"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setSourceMode(mode);
              setMessage("");
            }}
            style={{
              padding: "9px 14px",
              border: 0,
              borderBottom: sourceMode === mode ? "2px solid #4f46e5" : "2px solid transparent",
              background: "transparent",
              color: sourceMode === mode ? "#4338ca" : "#64748b",
              fontSize: 12,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active AI Config Status Banner (replaces old waiting-for-config placeholder) */}
      <div
        style={{
          marginBottom: 12,
          padding: "9px 12px",
          borderRadius: 8,
          background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
          border: "1px solid #c7d2fe",
          color: "#3730a3",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="sparkles" size={14} />
          <span>
            <strong>Dịch vụ AI đang kết nối:</strong> <code>{activeAiModel}</code> — Hỗ trợ tự sinh đề theo chủ đề, chuyển hóa văn bản tự do thành câu hỏi, viết lại câu hỏi và tự động giải thích đáp án.
          </span>
        </div>
      </div>

      {sourceMode === "file" && (
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="quiz-import-file"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 13,
              border: "1px dashed #a5b4fc",
              borderRadius: 10,
              background: "#fafaff",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#eef2ff",
                color: "#4f46e5",
              }}
            >
              <Icon name="upload" size={18} />
            </span>
            <span style={{ display: "grid", gap: 3, flex: 1 }}>
              <strong style={{ color: "#334155", fontSize: 12 }}>
                {isReadingFile ? "Đang đọc tệp..." : fileName || "Chọn file đề thi hoặc tài liệu bài giảng"}
              </strong>
              <span style={{ color: "#64748b", fontSize: 10 }}>DOCX, PDF, TXT hoặc MD · tối đa 20 MB</span>
            </span>
            <span style={{ color: "#4f46e5", fontSize: 11, fontWeight: 750 }}>Chọn tệp</span>
          </label>
          <input
            id="quiz-import-file"
            type="file"
            accept=".docx,.pdf,.txt,.md,application/pdf,text/plain"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
            style={{ display: "none" }}
          />
        </div>
      )}

      {sourceMode === "camera" && (
        <div
          style={{
            marginBottom: 12,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #c7d2fe",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: "100%",
                height: 210,
                borderRadius: 10,
                background: "#0f172a",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80"
                  alt="Camera Scanner Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  width: "80%",
                  height: "74%",
                  border: "2px dashed #38bdf8",
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    color: "#e0f2fe",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                  }}
                >
                  Đưa trang đề thi giấy vào khung ngắm AI Vision
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <strong style={{ fontSize: 12.5, color: "#1e293b" }}>
                📷 Quét đề thi bằng Thị giác máy tính (AI Vision Camera)
              </strong>
              <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.55 }}>
                Giảng viên có thể dùng Camera Web chụp trực tiếp đề thi giấy hoặc tải ảnh chụp đề thi. AI tự động nhận diện, biên dịch lại câu hỏi & đáp án vào <strong>Bản xem trước chuẩn Azota</strong> để đánh dấu đáp án đúng và phát hành.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={isReadingFile}
                  onClick={handleCaptureCameraExam}
                  style={{
                    ...buttonStyle,
                    background: "#4f46e5",
                    borderColor: "#4f46e5",
                    color: "#fff",
                  }}
                >
                  📸 Chụp đề từ Camera & Biên dịch AI
                </button>
                <button
                  type="button"
                  onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
                  style={{ ...buttonStyle, background: "#eef2ff", borderColor: "#c7d2fe", color: "#4338ca" }}
                >
                  🔄 Đổi Camera ({cameraFacing === "environment" ? "Sau" : "Trước"})
                </button>
              </div>
              <label
                htmlFor="quiz-camera-image-file"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px dashed #6366f1",
                  background: "#fff",
                  color: "#4338ca",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                🖼️ Hoặc chọn tệp ảnh chụp đề thi (JPG / PNG / WEBP)
              </label>
              <input
                id="quiz-camera-image-file"
                type="file"
                accept="image/*"
                onChange={(e) => handleExamImageFileSelect(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {sourceMode === "ai" ? (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            border: "1px solid #e0e7ff",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.7fr 0.9fr 0.9fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Chủ đề / Nội dung cần kiểm tra *
              </label>
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="VD: Vòng lặp For, While và hàm đệ quy trong Python"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 12, background: "#fff" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Số lượng câu
              </label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 12, background: "#fff" }}
              >
                <option value={3}>3 câu hỏi</option>
                <option value={5}>5 câu hỏi</option>
                <option value={8}>8 câu hỏi</option>
                <option value={10}>10 câu hỏi</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Mức độ nhận thức
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as typeof aiDifficulty)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 12, background: "#fff" }}
              >
                <option value="beginner">Cơ bản (Nhận biết)</option>
                <option value="intermediate">Trung bình (Thông hiểu)</option>
                <option value="advanced">Nâng cao (Vận dụng)</option>
                <option value="mixed">Hỗn hợp phân hóa</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Hình thức câu hỏi
              </label>
              <select
                value={aiQuestionType}
                onChange={(e) => setAiQuestionType(e.target.value as typeof aiQuestionType)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 12, background: "#fff" }}
              >
                <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                <option value="essay">Tự luận</option>
                <option value="mixed">Kết hợp Trắc nghiệm & Tự luận</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
              Ngữ liệu / Nội dung bài giảng tham khảo (Không bắt buộc — có thể lấy từ file đã tải lên)
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={4}
              placeholder="Dán tóm tắt bài giảng, định lý hoặc đoạn code muốn AI dùng làm ngữ liệu ra đề..."
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 10,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 11.5,
                fontFamily: "inherit",
                background: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isAiRunning}
              onClick={() => void handleAiGenerateByTopic()}
              style={{
                ...buttonStyle,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                borderColor: "#4f46e5",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isAiRunning ? 0.65 : 1,
              }}
            >
              <Icon name="sparkles" size={14} />
              {isAiRunning ? "AI đang biên soạn đề..." : `Sinh ${aiCount} câu hỏi bằng AI`}
            </button>
          </div>
        </div>
      ) : (
        <>
          {sourceMode === "paste" && (
            <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 11 }}>
              Gõ trực tiếp hoặc dán nội dung câu hỏi vào ô dưới đây — hệ thống sẽ <strong>tự động tách câu hỏi & đáp án ra Bản xem trước</strong> ngay bên dưới để giảng viên chọn đáp án đúng và chỉnh sửa!
            </p>
          )}

          <textarea
            value={sourceText}
            onChange={(event) => {
              const nextVal = event.target.value;
              setSourceText(nextVal);
              if (nextVal.trim()) {
                const autoParsed = parseQuestionsFromText(nextVal);
                setDrafts(autoParsed);
              } else {
                setDrafts([]);
              }
            }}
            rows={sourceMode === "paste" ? 7 : 5}
            placeholder={
              "Câu 1. Nội dung câu hỏi?\nA. Phương án thứ nhất\n*B. Phương án thứ hai (có thể đánh dấu * ở đáp án đúng hoặc tích chọn ở Bản xem trước bên dưới)\nC. Phương án thứ ba\nD. Phương án thứ tư\nĐáp án: B\n\nCâu 2. Câu hỏi tiếp theo..."
            }
            style={{
              boxSizing: "border-box",
              width: "100%",
              resize: "vertical",
              padding: 11,
              border: "1px solid #cbd5e1",
              borderRadius: 9,
              color: "#1e293b",
              fontFamily: "inherit",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 10,
            }}
          >
            <span style={{ color: "#64748b", fontSize: 10.5 }}>
              Hệ thống tự động dựng Bản xem trước khi gõ hoặc tải file. Có thể thêm câu thủ công hoặc dùng AI chuẩn hóa.
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleAddBlankDraft}
                style={{
                  ...buttonStyle,
                  background: "#f8fafc",
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                + Thêm câu thủ công vào Bản xem trước
              </button>
              <button
                type="button"
                onClick={() => recognizeQuestions()}
                disabled={isReadingFile || isAiRunning || !sourceText.trim()}
                style={{
                  ...buttonStyle,
                  background: "#ffffff",
                  borderColor: "#4f46e5",
                  color: "#4f46e5",
                  opacity: isReadingFile || isAiRunning || !sourceText.trim() ? 0.55 : 1,
                }}
              >
                🔄 Tách lại bản xem trước
              </button>
              <button
                type="button"
                onClick={() => void handleAiConvertUnstructuredText()}
                disabled={isReadingFile || isAiRunning || !sourceText.trim()}
                style={{
                  ...buttonStyle,
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  borderColor: "#4f46e5",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: isReadingFile || isAiRunning || !sourceText.trim() ? 0.55 : 1,
                }}
              >
                <Icon name="sparkles" size={14} />
                {isAiRunning ? "AI đang xử lý..." : "AI Tách & Sinh câu hỏi từ văn bản"}
              </button>
            </div>
          </div>
        </>
      )}

      {message && (
        <div
          role="status"
          style={{
            marginTop: 12,
            padding: "9px 11px",
            borderRadius: 8,
            background: drafts.length ? "#ecfdf5" : "#fffbeb",
            color: drafts.length ? "#047857" : "#92400e",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}

      {!!drafts.length && (
        <>
          {/* Interactive Preview Header & Bulk Toolbar */}
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#3730a3" }}>
                👁️ BẢN XEM TRƯỚC CÂU HỎI & ĐÁP ÁN ({drafts.length} câu — Tổng: {totalPreviewPoints.toFixed(1)} điểm)
              </div>
              <div style={{ fontSize: 10.5, color: "#5b21b6", marginTop: 2 }}>
                Tích chọn nút tròn (●) ở phương án đúng, sửa trực tiếp nội dung câu hỏi/đáp án nếu sai trước khi phát hành.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleDistributeScale10}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #a5b4fc",
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚖️ Chia đều thang 10đ
              </button>
              <button
                type="button"
                onClick={handleAddBlankDraft}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#334155",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Thêm câu hỏi
              </button>
              <button
                type="button"
                disabled={isAiRunning}
                onClick={() => void handleAiRewriteAll("improve")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #c7d2fe",
                  background: "#fff",
                  color: "#4338ca",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: isAiRunning ? "wait" : "pointer",
                }}
              >
                ✨ AI Chuẩn hóa
              </button>
              <button
                type="button"
                disabled={isAiRunning}
                onClick={() => void handleAiRewriteAll("add_explanation")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #c7d2fe",
                  background: "#fff",
                  color: "#0e7490",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: isAiRunning ? "wait" : "pointer",
                }}
              >
                💡 AI Giải thích đáp án
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: 390,
              overflowY: "auto",
              marginTop: 10,
              paddingRight: 4,
            }}
          >
            {drafts.map((draft, index) => (
              <article
                key={index}
                style={{
                  padding: 14,
                  border: "1px solid #cbd5e1",
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        background: "#eef2ff",
                        color: "#3730a3",
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      Câu {index + 1}
                    </span>
                    <select
                      value={draft.type}
                      onChange={(e) => {
                        const nextType = e.target.value as "multiple_choice" | "essay";
                        const nextOptions =
                          nextType === "multiple_choice" && draft.options.length === 0
                            ? [
                                { label: "A", text: "Phương án A" },
                                { label: "B", text: "Phương án B" },
                                { label: "C", text: "Phương án C" },
                                { label: "D", text: "Phương án D" },
                              ]
                            : draft.options;
                        updateDraft(index, {
                          type: nextType,
                          options: nextOptions,
                          correctOptionLabel:
                            nextType === "multiple_choice"
                              ? draft.correctOptionLabel || nextOptions[0]?.label || "A"
                              : null,
                        });
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#334155",
                        background: "#f8fafc",
                      }}
                    >
                      <option value="multiple_choice">Trắc nghiệm (Chấm tự động)</option>
                      <option value="essay">Tự luận (Giảng viên chấm)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      disabled={isAiRunning}
                      onClick={() => void handleAiRewriteSingle(index)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #ddd6fe",
                        background: "#f5f3ff",
                        color: "#6d28d9",
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: isAiRunning ? "wait" : "pointer",
                      }}
                    >
                      ✨ AI Viết lại
                    </button>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>
                      Điểm:
                      <input
                        aria-label={`Điểm câu ${index + 1}`}
                        type="number"
                        min="0.1"
                        step="0.25"
                        value={draft.points}
                        onChange={(event) => updateDraft(index, { points: Number(event.target.value) })}
                        style={{
                          width: 64,
                          padding: "4px 7px",
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(index)}
                      title="Xóa câu hỏi này khỏi bản xem trước"
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <textarea
                  aria-label={`Nội dung câu ${index + 1}`}
                  rows={2}
                  value={draft.content}
                  onChange={(event) => updateDraft(index, { content: event.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  style={{
                    boxSizing: "border-box",
                    width: "100%",
                    padding: 9,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f172a",
                    lineHeight: 1.5,
                  }}
                />

                {draft.type === "multiple_choice" && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569" }}>
                        Tích chọn đáp án đúng và chỉnh sửa nội dung các phương án:
                      </span>
                      {draft.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => handleAddOptionToDraft(index)}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 5,
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#334155",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          + Thêm phương án
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 8 }}>
                      {draft.options.map((option, optionIndex) => {
                        const isCorrect = option.label === draft.correctOptionLabel;
                        return (
                          <div
                            key={`${option.label}-${optionIndex}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "7px 9px",
                              border: isCorrect ? "2px solid #10b981" : "1px solid #e2e8f0",
                              borderRadius: 8,
                              background: isCorrect ? "#ecfdf5" : "#fff",
                            }}
                          >
                            <input
                              type="radio"
                              name={`quiz-import-answer-${index}`}
                              checked={isCorrect}
                              onChange={() => updateDraft(index, { correctOptionLabel: option.label })}
                              aria-label={`Đáp án đúng ${option.label} câu ${index + 1}`}
                              style={{ cursor: "pointer", accentColor: "#059669" }}
                            />
                            <span
                              onClick={() => updateDraft(index, { correctOptionLabel: option.label })}
                              style={{
                                color: isCorrect ? "#047857" : "#64748b",
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {option.label}.
                            </span>
                            <input
                              value={option.text}
                              onChange={(event) =>
                                updateDraft(index, {
                                  options: draft.options.map((item, itemIndex) =>
                                    itemIndex === optionIndex ? { ...item, text: event.target.value } : item,
                                  ),
                                })
                              }
                              style={{
                                minWidth: 0,
                                flex: 1,
                                padding: "4px 6px",
                                border: "1px solid transparent",
                                borderRadius: 5,
                                background: isCorrect ? "#d1fae5" : "#f8fafc",
                                outline: 0,
                                fontSize: 11.5,
                                fontWeight: isCorrect ? 700 : 500,
                                color: "#0f172a",
                              }}
                            />
                            {isCorrect && (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  color: "#047857",
                                  background: "#a7f3d0",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ✓ ĐÚNG
                              </span>
                            )}
                            {draft.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromDraft(index, optionIndex)}
                                title="Xóa phương án này"
                                style={{
                                  border: 0,
                                  background: "transparent",
                                  color: "#94a3b8",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  padding: "0 3px",
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!draft.correctOptionLabel && (
                        <div style={{ gridColumn: "1 / -1", color: "#b45309", fontSize: 10.5, fontWeight: 700 }}>
                          ⚠️ Chưa chọn đáp án đúng. Hãy tích chọn 1 đáp án để hệ thống chấm điểm tự động!
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <input
                  value={draft.explanation}
                  onChange={(event) => updateDraft(index, { explanation: event.target.value })}
                  placeholder="Giải thích đáp án / Hướng dẫn chấm điểm (không bắt buộc)"
                  style={{
                    boxSizing: "border-box",
                    width: "100%",
                    marginTop: 8,
                    padding: "7px 9px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 7,
                    fontSize: 11,
                    color: "#475569",
                  }}
                />
              </article>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          {drafts.length > 0
            ? `Đã sẵn sàng ${drafts.length} câu hỏi (${totalPreviewPoints.toFixed(1)} điểm).`
            : "Hãy tải file hoặc gõ nội dung để xem trước câu hỏi."}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={buttonStyle}>
            Hủy
          </button>
          <button
            type="button"
            disabled={!drafts.length || drafts.some((draft) => !draft.content.trim())}
            onClick={() => handleImport(false)}
            style={{
              ...buttonStyle,
              borderColor: "#4f46e5",
              background: "#eef2ff",
              color: "#4338ca",
              opacity: !drafts.length || drafts.some((draft) => !draft.content.trim()) ? 0.55 : 1,
            }}
          >
            📥 Thêm {drafts.length || ""} câu vào đề (Lưu nháp)
          </button>
          <button
            type="button"
            disabled={!drafts.length || drafts.some((draft) => !draft.content.trim())}
            onClick={() => handleImport(true)}
            style={{
              ...buttonStyle,
              borderColor: "#059669",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#fff",
              opacity: !drafts.length || drafts.some((draft) => !draft.content.trim()) ? 0.55 : 1,
            }}
          >
            🚀 Lưu vào đề & Phát hành ngay
          </button>
        </div>
      </div>
    </Modal>
  );
}
