// ============================================================================
// EDUMIND AI - NOTIFICATION DRAWER (MODULE 12)
// Hộp thông báo người dùng với tính năng xem, đánh dấu đã đọc và xóa
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { storageService } from "@/services/storageService";
import { Notification } from "@/types";
import { Icon } from "@/components/ui/Icons";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export function NotificationDrawer({ isOpen, onClose, onNavigate }: NotificationDrawerProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    const list = storageService.getNotifications(currentUser.id);
    setNotifications(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser.id]);

  const handleMarkAsRead = (id: string) => {
    storageService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    storageService.markAllNotificationsRead(currentUser.id);
    loadNotifications();
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storageService.deleteNotification(id);
    loadNotifications();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8900,
        background: "rgba(0, 0, 0, 0.2)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "72px",
          right: "40px",
          width: "380px",
          maxHeight: "520px",
          borderRadius: "12px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideIn 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid #f1f5f9",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#6366f1" }}><Icon name="bell" size={16} /></span>
            <strong style={{ fontSize: "13px", color: "#1e293b" }}>Thông báo</strong>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "10px",
                background: "#e0e7ff",
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              {notifications.filter((n) => !n.isRead).length} mới
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "4px",
                  padding: "3px 7px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#4338ca",
                  cursor: "pointer",
                }}
              >
                Đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "4px",
              }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div style={{ padding: "8px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "#94a3b8", fontSize: "12px" }}>
              Bạn không có thông báo nào.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: item.isRead ? "#f8fafc" : "#f5f3ff",
                  border: item.isRead ? "1px solid #f1f5f9" : "1px solid #ddd6fe",
                  display: "flex",
                  gap: "10px",
                  position: "relative",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ marginTop: "2px" }}>
                  {item.type === "success" && <span style={{ color: "#10b981" }}><Icon name="checkCircle" size={16} /></span>}
                  {item.type === "warning" && <span style={{ color: "#f59e0b" }}><Icon name="alertCircle" size={16} /></span>}
                  {item.type === "alert" && <span style={{ color: "#ef4444" }}><Icon name="alertCircle" size={16} /></span>}
                  {item.type === "info" && <span style={{ color: "#6366f1" }}><Icon name="sparkles" size={16} /></span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "12px", color: "#1e293b" }}>{item.title}</strong>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                      {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                    {item.message}
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#6366f1",
                          fontSize: "10px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        fontSize: "10px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
