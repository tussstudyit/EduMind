// ============================================================================
// EDUMIND AI - SYSTEM LOGS & AI CONFIG COMPONENT (MODULE 13)
// Admin cấu hình dịch vụ AI/OCR, đèn trạng thái dịch vụ và xem nhật ký audit chỉ đọc
// Quy tắc UI bắt buộc: Nhật ký chỉ hiển thị để đọc, tuyệt đối không có nút sửa/xóa log
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { AIConfig, SystemLog } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";

export function SystemConfigView() {
  const { success } = useToast();
  const [config, setConfig] = useState<AIConfig>(storageService.getAIConfig());
  const [logs, setLogs] = useState<SystemLog[]>(storageService.getSystemLogs());
  const [logFilter, setLogFilter] = useState("all");
  const [searchLog, setSearchLog] = useState("");

  // Form states
  const [provider, setProvider] = useState(config.provider);
  const [modelName, setModelName] = useState(config.modelName);
  const [ocrEngine, setOcrEngine] = useState(config.ocrEngine);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [temperature, setTemperature] = useState(config.temperature);
  const [ocrThreshold, setOcrThreshold] = useState(config.ocrConfidenceThreshold || 0.85);
  const [maxUploadSize, setMaxUploadSize] = useState(config.maxUploadSizeMB || 10);

  useEffect(() => {
    const currentConfig = storageService.getAIConfig();
    setConfig(currentConfig);
    setProvider(currentConfig.provider);
    setModelName(currentConfig.modelName);
    setOcrEngine(currentConfig.ocrEngine);
    setMaxTokens(currentConfig.maxTokens);
    setTemperature(currentConfig.temperature);
    setOcrThreshold(currentConfig.ocrConfidenceThreshold || 0.85);
    setMaxUploadSize(currentConfig.maxUploadSizeMB || 10);

    setLogs(storageService.getSystemLogs());
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.updateAIConfig({
      provider,
      modelName,
      ocrEngine,
      maxTokens: Number(maxTokens),
      temperature: Number(temperature),
      ocrConfidenceThreshold: Number(ocrThreshold),
      maxUploadSizeMB: Number(maxUploadSize),
    });
    setConfig(updated);
    setLogs(storageService.getSystemLogs());
    success("Lưu cấu hình AI thành công", `Mô hình '${modelName}' & ngưỡng OCR ${ocrThreshold * 100}% đã được áp dụng toàn hệ thống.`);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = logFilter === "all" || l.level === logFilter;
    const matchesSearch =
      searchLog.trim() === "" ||
      l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.details.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchLog.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 13: BÁO CÁO, NHẬT KÝ & CẤU HÌNH AI (ADMIN ONLY)</span>
          <h2>Trạng thái Dịch vụ, Cấu hình AI/OCR & Nhật ký Kiểm toán</h2>
        </div>
      </div>

      {/* 3 Service Status Cards with Live Indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {/* Service 1: AI LLM Service */}
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#ede9fe",
              color: "#6366f1",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="sparkles" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>Dịch vụ AI (LLM Service)</strong>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: "#059669" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Online
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
              Model: {config.modelName}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
              <span>Độ trễ: 185ms</span>
              <span>Uptime: 99.98%</span>
            </div>
          </div>
        </div>

        {/* Service 2: OCR Worker Engine */}
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#ecfdf5",
              color: "#059669",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="camera" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>OCR Worker Engine</strong>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: "#059669" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Online
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
              Engine: {config.ocrEngine}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
              <span>Độ trễ: 420ms</span>
              <span>Worker Threads: 4</span>
            </div>
          </div>
        </div>

        {/* Service 3: Storage & Mock Cache */}
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#e0f2fe",
              color: "#0284c7",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="brain" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "12.5px", color: "#1e293b" }}>Storage & Mock Layer</strong>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: "#0284c7" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0284c7", display: "inline-block" }} />
                Đồng bộ 100%
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
              13 Modules Data Persistent
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
              <span>Engine: LocalStorage API</span>
              <span>Toàn vẹn: Chuẩn xác</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Form AI/OCR Config, Right = Read-Only Audit Log */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.15fr", gap: "20px", alignItems: "start" }}>
        {/* Left: AI & OCR Parameter Configuration Form */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <span className="eyebrow">THIẾT LẬP THAM SỐ DỊCH VỤ</span>
              <h2>Cấu hình AI Tutor & OCR Worker</h2>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Nhà cung cấp LLM
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const prov = e.target.value as "gemini" | "openai";
                    setProvider(prov);
                    setModelName(prov === "gemini" ? "gemini-2.0-flash-exp" : "gpt-4o");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#fff",
                  }}
                >
                  <option value="gemini">Google Gemini API (Khuyên dùng)</option>
                  <option value="openai">OpenAI API</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Tên Mô hình (Model Identifier)
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#fff",
                  }}
                >
                  {provider === "gemini" ? (
                    <>
                      <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Tốc độ cao nhất)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Tư duy toán học phức tạp)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Chuẩn ổn định)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o">gpt-4o (Đa phương thức)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini (Tiết kiệm token)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Công nghệ Quét tài liệu OCR (Module 10)
              </label>
              <select
                value={ocrEngine}
                onChange={(e) => setOcrEngine(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#fff",
                }}
              >
                <option value="gemini-multimodal">Gemini Multimodal Vision (Tự động nhận diện công thức Toán & Code)</option>
                <option value="google-vision">Google Cloud Vision OCR API</option>
                <option value="tesseract">Tesseract.js OCR (Chạy cục bộ WebAssembly)</option>
              </select>
            </div>

            {/* Sliders for Tokens & Temperature */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Max Tokens:
                  </label>
                  <strong style={{ fontSize: "11.5px", color: "#4f46e5" }}>{maxTokens}</strong>
                </div>
                <input
                  type="range"
                  min="1024"
                  max="8192"
                  step="512"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#4f46e5" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Độ sáng tạo (Temperature):
                  </label>
                  <strong style={{ fontSize: "11.5px", color: "#4f46e5" }}>{temperature}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#4f46e5" }}
                />
              </div>
            </div>

            {/* Sliders for OCR Confidence & Upload limit */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Ngưỡng tin cậy OCR:
                  </label>
                  <strong style={{ fontSize: "11.5px", color: "#059669" }}>{Math.round(ocrThreshold * 100)}%</strong>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={ocrThreshold}
                  onChange={(e) => setOcrThreshold(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#059669" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Kích thước ảnh tối đa:
                  </label>
                  <strong style={{ fontSize: "11.5px", color: "#059669" }}>{maxUploadSize} MB</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#059669" }}
                />
              </div>
            </div>

            {/* API Key Security Notice */}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              🔒 <strong>Bảo mật API Key:</strong> {config.apiKeyMasked} (Chỉ được lưu trong biến môi trường server khi bàn giao backend thật).
            </div>

            <button
              type="submit"
              style={{
                alignSelf: "flex-end",
                padding: "9px 22px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
              }}
            >
              Lưu cấu hình AI & OCR
            </button>
          </form>
        </div>

        {/* Right: System Audit Logs (Strictly READ-ONLY / No edit or delete) */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="panel-heading" style={{ marginBottom: "2px" }}>
            <div>
              <span className="eyebrow">NHẬT KÝ HỆ THỐNG KIỂM TOÁN (AUDIT TRAIL)</span>
              <h2>Audit Logs (Chế độ Chỉ Đọc)</h2>
            </div>
            {/* Filter by level */}
            <div style={{ display: "flex", gap: "4px" }}>
              {["all", "info", "warn", "error"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    border: logFilter === lvl ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: logFilter === lvl ? "#4f46e5" : "#fff",
                    color: logFilter === lvl ? "#fff" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Security Banner: Strictly READ-ONLY Rule */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              fontSize: "10.5px",
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="shield" size={14} />
            <span>
              <strong>Quy tắc bảo mật hệ thống:</strong> Nhật ký kiểm toán được niêm phong <strong>CHỈ ĐỌC</strong>. Tuyệt đối không hỗ trợ chức năng sửa hoặc xóa log.
            </span>
          </div>

          {/* Search box for logs */}
          <input
            type="text"
            placeholder="Tìm theo hành động, người thực hiện hoặc nội dung..."
            value={searchLog}
            onChange={(e) => setSearchLog(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "11.5px",
            }}
          />

          {/* Logs List */}
          <div
            style={{
              maxHeight: "440px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingRight: "4px",
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "11.5px" }}>
                Không tìm thấy bản ghi nhật ký phù hợp.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: log.level === "warn" ? "#fffbeb" : log.level === "error" ? "#fef2f2" : "#f8fafc",
                    border: log.level === "warn" ? "1px solid #fde68a" : log.level === "error" ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontSize: "8.5px",
                          fontWeight: 800,
                          background:
                            log.level === "warn"
                              ? "#f59e0b"
                              : log.level === "error"
                              ? "#ef4444"
                              : "#6366f1",
                          color: "#fff",
                        }}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <strong style={{ color: "#1e293b" }}>{log.action}</strong>
                    </div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                      {new Date(log.timestamp).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  <div style={{ color: "#334155", marginTop: "4px", lineHeight: "1.4" }}>
                    {log.details}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "9.5px", color: "#94a3b8" }}>
                    <span>Người thực hiện: <strong>{log.actorName}</strong> ({log.actorRole.toUpperCase()})</span>
                    <span>Log ID: {log.id}</span>
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
