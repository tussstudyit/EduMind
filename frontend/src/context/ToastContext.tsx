// ============================================================================
// EDUMIND AI - TOAST NOTIFICATION CONTEXT
// Hiển thị phản hồi tức thì cho các hành động CRUD (Thêm, Sửa, Xóa, Nộp bài)
// ============================================================================

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icons";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast("success", title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast("error", title, message), [toast]);
  const info = useCallback((title: string, message?: string) => toast("info", title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast("warning", title, message), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast Render Container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              animation: "slideIn 0.25s ease-out",
            }}
          >
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              {t.type === "success" && <span style={{ color: "#10b981" }}><Icon name="checkCircle" size={18} /></span>}
              {t.type === "error" && <span style={{ color: "#ef4444" }}><Icon name="alertCircle" size={18} /></span>}
              {t.type === "warning" && <span style={{ color: "#f59e0b" }}><Icon name="alertCircle" size={18} /></span>}
              {t.type === "info" && <span style={{ color: "#6366f1" }}><Icon name="sparkles" size={18} /></span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 650, color: "#1e293b" }}>{t.title}</div>
              {t.message && (
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", lineHeight: "1.4" }}>
                  {t.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "2px",
                borderRadius: "4px",
              }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
