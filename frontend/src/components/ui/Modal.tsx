// ============================================================================
// EDUMIND AI - REUSABLE MODAL COMPONENT
// Dialog chuẩn hóa cho các tác vụ CRUD (Thêm, Sửa, Xác nhận xóa, Chấm điểm)
// ============================================================================

"use client";

import React, { useEffect } from "react";
import { Icon } from "@/components/ui/Icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "560px",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "14px",
          background: "#ffffff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "modalZoom 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>{title}</h3>
            {subtitle && (
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              display: "grid",
              width: "32px",
              height: "32px",
              placeItems: "center",
              borderRadius: "8px",
              border: "none",
              background: "#f8fafc",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
