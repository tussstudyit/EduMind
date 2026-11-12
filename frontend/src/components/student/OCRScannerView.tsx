// ============================================================================
// EDUMIND AI - OCR DOCUMENT SCANNER COMPONENT (MODULE 10)
// Học viên kéo thả ảnh hoặc chụp webcam, giả lập xử lý 2s, giao diện 2 cột ảnh-text,
// cho phép hiệu đính văn bản & nút xác nhận gửi sang AI Tutor
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { OCRScan } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";

interface OCRScannerViewProps {
  onOpenAITutor: (prompt?: string) => void;
}

export function OCRScannerView({ onOpenAITutor }: OCRScannerViewProps) {
  const { currentUser } = useAuth();
  const { success, info, warning } = useToast();

  const [scans, setScans] = useState<OCRScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<OCRScan | null>(null);
  const [correctedText, setCorrectedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Webcam Modal State
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScans = () => {
    const list = storageService.getOCRScans(currentUser.id);
    setScans(list);
    if (list.length > 0 && !selectedScan) {
      setSelectedScan(list[0]);
      setCorrectedText(list[0].correctedText);
    }
  };

  useEffect(() => {
    loadScans();
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedScan) {
      setCorrectedText(selectedScan.correctedText);
    }
  }, [selectedScan]);

  // Handler for uploading or capturing an image
  const handleProcessNewImage = (fileName: string, imageUrl: string, rawText: string) => {
    // 1. Tạo bản quét với trạng thái "Đang xử lý" (processing)
    const newScan = storageService.addOCRScan(
      currentUser.id,
      fileName,
      imageUrl,
      rawText,
      "processing"
    );

    setSelectedScan(newScan);
    setCorrectedText("Đang nhận diện ký tự qua OCR Engine...");
    setScans(storageService.getOCRScans(currentUser.id));
    info("Đang xử lý hình ảnh qua Engine OCR...", "Mô hình Gemini Vision đang phân tích ký tự...");

    // 2. Giả lập sau chính xác 2 giây (2000ms) chuyển sang "Hoàn thành" (completed)
    setTimeout(() => {
      const completedScan = storageService.updateOCRStatus(newScan.id, "completed", rawText);
      if (completedScan) {
        setSelectedScan(completedScan);
        setCorrectedText(completedScan.correctedText);
        setScans(storageService.getOCRScans(currentUser.id));
        success("Nhận diện OCR hoàn tất!", `Đã trích xuất văn bản từ [${fileName}].`);
      }
    }, 2000);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const detectedSample =
        `Bài tập toán cao cấp trích xuất từ [${file.name}]:\n` +
        `1. Cho tích phân bất định: I = ∫ (2x + 3) / (x^2 + 4x + 8) dx. Tính giá trị của I.\n` +
        `2. Tìm cực trị của hàm hai biến: z = x^3 + y^3 - 3xy.`;
      handleProcessNewImage(file.name, dataUrl, detectedSample);
    };
    reader.readAsDataURL(file);
  };

  // Webcam Mock Snapshot
  const handleCaptureWebcam = () => {
    setIsWebcamOpen(false);
    setIsCameraActive(false);
    const mockWebcamImage = "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80";
    const detectedMath =
      `Đề thi chụp từ Webcam:\n` +
      `Câu 1: Giải phương trình vi phân cấp 2: y'' - 5y' + 6y = 0 với điều kiện ban đầu y(0) = 1, y'(0) = 0.\n` +
      `Câu 2: Viết giải thuật đệ quy tính số mũ nhị phân (Binary Exponentiation).`;

    handleProcessNewImage(`webcam_scan_${Date.now()}.jpg`, mockWebcamImage, detectedMath);
  };

  const handleSaveCorrection = () => {
    if (!selectedScan) return;
    const updated = storageService.updateOCRText(selectedScan.id, correctedText);
    if (updated) {
      setSelectedScan(updated);
      success("Đã lưu văn bản hiệu đính", "Nội dung chuẩn xác đã sẵn sàng gửi cho AI.");
      loadScans();
    }
  };

  const handleSendToAI = () => {
    if (!selectedScan) return;
    handleSaveCorrection();
    storageService.sendOCRToAI(selectedScan.id, currentUser.id);

    const promptText = `Chào AI Tutor, mình vừa quét tài liệu OCR có nội dung như sau. Hãy hướng dẫn mình giải chi tiết nhé:\n\n${correctedText}`;
    success("Đã gửi sang AI Tutor!", "Hệ thống đang chuyển bạn sang phòng trò chuyện cùng trợ lý AI.");

    setTimeout(() => {
      onOpenAITutor(promptText);
    }, 500);
  };

  const handleDeleteScan = (scanId: string) => {
    if (confirm("Bạn có chắc muốn xóa bản quét OCR này? Hành động này không thể hoàn tác.")) {
      storageService.deleteOCRScan(scanId);
      info("Đã xóa bản quét OCR");
      const list = storageService.getOCRScans(currentUser.id);
      setScans(list);
      setSelectedScan(list[0] || null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
      />

      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 10: QUÉT TÀI LIỆU OCR & TRÍCH XUẤT THÔNG MINH</span>
          <h2>Trích xuất Đề bài & Tài liệu qua AI OCR Engine</h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="quick-action"
            style={{ cursor: "pointer", background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}
          >
            <Icon name="upload" size={14} /> Tải ảnh lên
          </button>
          <button
            onClick={() => {
              setIsWebcamOpen(true);
              setIsCameraActive(true);
            }}
            className="quick-action"
            style={{ cursor: "pointer", background: "#ffffff" }}
          >
            <Icon name="camera" size={14} /> Mở Webcam chụp ảnh
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "24px",
          borderRadius: "12px",
          border: isDragging ? "2px dashed #4f46e5" : "2px dashed #cbd5e1",
          background: isDragging ? "#eef2ff" : "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#ede9fe",
            color: "#6366f1",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="upload" size={20} />
        </div>
        <strong style={{ fontSize: "13px", color: "#1e293b" }}>
          Kéo thả hình ảnh bài tập vào đây, hoặc <span style={{ color: "#4f46e5" }}>bấm để chọn tệp</span>
        </strong>
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          Hỗ trợ JPG, PNG, WEBP · Tự động xử lý OCR nhận diện công thức toán học và mã nguồn
        </span>
      </div>

      {/* Main Split: Scan history on left, 2-column OCR Editor on right */}
      <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Scans List */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", color: "#1e293b" }}>Lịch sử bản quét ({scans.length})</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {scans.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                Chưa có bản quét nào. Hãy tải ảnh lên hoặc chụp webcam.
              </div>
            ) : (
              scans.map((s) => {
                const isSelected = selectedScan?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScan(s)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                      background: isSelected ? "#f5f3ff" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "#ede9fe",
                          color: "#6366f1",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="camera" size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: "11.5px", color: "#1e293b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.fileName}
                        </strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          {/* Status Badge */}
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "9px",
                              fontWeight: 700,
                              background:
                                s.status === "completed"
                                  ? "#ecfdf5"
                                  : s.status === "processing"
                                  ? "#fffbeb"
                                  : "#fef2f2",
                              color:
                                s.status === "completed"
                                  ? "#065f46"
                                  : s.status === "processing"
                                  ? "#b45309"
                                  : "#dc2626",
                            }}
                          >
                            {s.status === "completed"
                              ? "✓ Hoàn thành"
                              : s.status === "processing"
                              ? "⏳ Đang xử lý..."
                              : "✗ Lỗi"}
                          </span>
                          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScan(s.id);
                      }}
                      title="Xóa bản quét"
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Scan 2-Column Interface (Left: Original Image, Right: Textarea) */}
        {selectedScan ? (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Action Top Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      background:
                        selectedScan.status === "completed"
                          ? "#ecfdf5"
                          : selectedScan.status === "processing"
                          ? "#fffbeb"
                          : "#fef2f2",
                      color:
                        selectedScan.status === "completed"
                          ? "#065f46"
                          : selectedScan.status === "processing"
                          ? "#b45309"
                          : "#dc2626",
                    }}
                  >
                    TRẠNG THÁI: {selectedScan.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Tạo lúc: {new Date(selectedScan.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <h2 style={{ margin: "4px 0 0", fontSize: "16px", color: "#1e293b" }}>{selectedScan.fileName}</h2>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={selectedScan.status === "processing"}
                  onClick={() => handleDeleteScan(selectedScan.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fee2e2",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Icon name="trash" size={13} /> Xóa bản quét
                </button>
                <button
                  disabled={selectedScan.status === "processing"}
                  onClick={handleSaveCorrection}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: selectedScan.status === "processing" ? "not-allowed" : "pointer",
                  }}
                >
                  Lưu chỉnh sửa
                </button>
                <button
                  disabled={selectedScan.status === "processing"}
                  onClick={handleSendToAI}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedScan.status === "processing" ? "#cbd5e1" : "#4f46e5",
                    color: "#ffffff",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: selectedScan.status === "processing" ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                  }}
                >
                  <Icon name="sparkles" size={14} /> Xác nhận gửi sang AI Tutor
                </button>
              </div>
            </div>

            {/* Processing banner if status is processing */}
            {selectedScan.status === "processing" && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  color: "#92400e",
                }}
              >
                <Icon name="sparkles" size={16} className="text-amber-600 animate-spin" />
                <span>
                  <strong>Hệ thống đang quét OCR hình ảnh:</strong> Đang phân tích các vùng chữ, tự động nhận diện công thức toán học và mã nguồn (Sẽ hoàn thành sau 2 giây)...
                </span>
              </div>
            )}

            {/* 2-COLUMN VIEW: LEFT = ORIGINAL IMAGE, RIGHT = TEXTAREA */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
              {/* Column 1: Original Image */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    CỘT 1: ẢNH GỐC ĐÃ TẢI LÊN / CHỤP LẠI
                  </label>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>Định dạng ảnh tự nhiên</span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "280px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#1e293b",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <img
                    src={selectedScan.imageUrl}
                    alt={selectedScan.fileName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  {selectedScan.status === "processing" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.75)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        color: "#ffffff",
                      }}
                    >
                      <Icon name="sparkles" size={24} className="text-indigo-400 animate-spin" />
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Tia quét OCR đang xử lý...</span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                  <span>Tên tệp: {selectedScan.fileName}</span>
                  <span>Độ phân giải tối ưu</span>
                </div>
              </div>

              {/* Column 2: Editable Recognized Text Area */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#4f46e5" }}>
                    CỘT 2: VĂN BẢN NHẬN DIỆN (CHO PHÉP SỬA LẠI TEXT)
                  </label>
                  <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
                    {selectedScan.status === "completed" ? "✓ Đã nhận diện" : "Đang chờ..."}
                  </span>
                </div>

                <textarea
                  rows={12}
                  disabled={selectedScan.status === "processing"}
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  placeholder="Văn bản nhận diện sẽ hiển thị ở đây sau khi quét xong. Bạn có thể sửa trực tiếp..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#1e293b",
                    outline: "none",
                    fontFamily: "Consolas, Menlo, Monaco, monospace",
                    background: selectedScan.status === "processing" ? "#f8fafc" : "#ffffff",
                    cursor: selectedScan.status === "processing" ? "not-allowed" : "text",
                  }}
                />

                <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                  💡 <strong>Hướng dẫn:</strong> Kiểm tra lại các công thức toán hoặc biến code bị nhầm lẫn, sau đó bấm <strong>&quot;Xác nhận gửi sang AI Tutor&quot;</strong> để nhận lời giải chi tiết.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Webcam Simulation Modal */}
      <Modal
        isOpen={isWebcamOpen}
        onClose={() => {
          setIsWebcamOpen(false);
          setIsCameraActive(false);
        }}
        title="Chụp ảnh tài liệu qua Webcam"
        subtitle="Căn chỉnh đề bài hoặc tài liệu vào giữa khung hình và bấm nút chụp."
        maxWidth="600px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              width: "100%",
              height: "320px",
              borderRadius: "10px",
              background: "#0f172a",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            {/* Live Camera Simulation Viewfinder */}
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80"
              alt="Camera preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
            />

            {/* Target Viewfinder Grid Box */}
            <div
              style={{
                position: "absolute",
                width: "75%",
                height: "70%",
                border: "2px dashed #38bdf8",
                borderRadius: "8px",
                pointerEvents: "none",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  background: "rgba(0,0,0,0.6)",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: "#e0f2fe",
                }}
              >
                Đặt đề bài vào giữa khung quét
              </span>
            </div>

            <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "12px", fontSize: "10px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
              <span>LIVE CAM (1080p)</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                setIsWebcamOpen(false);
                setIsCameraActive(false);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Đóng Camera
            </button>

            <button
              type="button"
              onClick={handleCaptureWebcam}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
              }}
            >
              <Icon name="camera" size={15} /> Chụp ảnh & Nhận diện ngay
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
