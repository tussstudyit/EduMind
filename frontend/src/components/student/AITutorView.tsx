// ============================================================================
// EDUMIND AI - AI TUTOR CHAT COMPONENT (MODULE 9)
// Trợ lý học tập thông minh: Quản lý hội thoại, lịch sử tin nhắn & streaming response
// Quy tắc UI: Không có nút Edit trên tin nhắn để giữ nguyên tính toàn vẹn lịch sử
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Conversation, ChatMessage } from "@/types";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";

interface AITutorViewProps {
  initialPrompt?: string;
}

export function AITutorView({ initialPrompt }: AITutorViewProps) {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  // Rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Streaming / Typing simulation state
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingAssistantMsg, setStreamingAssistantMsg] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = (preserveActive: boolean = true) => {
    const list = storageService.getConversations(currentUser.id, activeTab === "archived");
    setConversations(list);
    if (!preserveActive || !activeConv || !list.some((c) => c.id === activeConv.id)) {
      setActiveConv(list[0] || null);
    }
  };

  useEffect(() => {
    loadConversations(false);
  }, [currentUser.id, activeTab]);

  useEffect(() => {
    if (activeConv) {
      setMessages(storageService.getMessages(activeConv.id));
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingAssistantMsg(null);
    } else {
      setMessages([]);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isStreaming, streamingContent]);

  // Handle pre-seeded initial prompt from Learning Room or OCR
  useEffect(() => {
    if (initialPrompt && activeConv && !isStreaming && !isTyping) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // Conversation Management Actions
  const handleCreateNewConv = () => {
    const newConv = storageService.createConversation(
      currentUser.id,
      "Cuộc trò chuyện mới với AI Tutor"
    );
    setActiveTab("active");
    const list = storageService.getConversations(currentUser.id, false);
    setConversations(list);
    setActiveConv(newConv);
    success("Đã tạo cuộc trò chuyện mới");
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (convId: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingTitle.trim()) return;

    storageService.renameConversation(convId, editingTitle.trim());
    setEditingConvId(null);
    loadConversations(true);
    if (activeConv?.id === convId) {
      setActiveConv({ ...activeConv, title: editingTitle.trim() });
    }
    info("Đã đổi tên cuộc trò chuyện");
  };

  const handleToggleArchive = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = storageService.toggleArchiveConversation(convId);
    if (ok) {
      const wasArchived = activeTab === "archived";
      info(wasArchived ? "Đã khôi phục hội thoại" : "Đã chuyển hội thoại vào lưu trữ");
      loadConversations(false);
    }
  };

  const handleDeleteConv = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này khỏi lịch sử? Hành động này không thể hoàn tác.")) {
      storageService.deleteConversation(convId);
      info("Đã xóa cuộc trò chuyện");
      loadConversations(false);
    }
  };

  // Sending and Simulated Streaming
  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !activeConv || isTyping || isStreaming) return;

    setInputMessage("");

    // Lưu vào storage & nhận câu trả lời đã sinh từ Mock Engine
    const { userMsg, assistantMsg } = storageService.sendMessage(activeConv.id, text.trim());

    // Cập nhật tin nhắn người dùng ngay lập tức
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Mô phỏng độ trễ suy nghĩ của LLM (500ms) trước khi bắt đầu streaming
    setTimeout(() => {
      setIsTyping(false);
      setIsStreaming(true);
      setStreamingAssistantMsg(assistantMsg);
      setStreamingContent("");

      const fullReply = assistantMsg.content;
      let currentIndex = 0;

      const streamTimer = setInterval(() => {
        // Tăng ngẫu nhiên 2 - 4 ký tự mỗi tick (20ms) để tạo cảm giác streaming chân thực
        currentIndex += Math.floor(Math.random() * 3) + 2;

        if (currentIndex >= fullReply.length) {
          clearInterval(streamTimer);
          setStreamingContent(fullReply);
          setIsStreaming(false);
          setStreamingAssistantMsg(null);
          // Gắn tin nhắn AI hoàn chỉnh vào danh sách
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          setStreamingContent(fullReply.substring(0, currentIndex));
        }
      }, 22);
    }, 550);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 9: TRỢ LÝ HỌC TẬP THÔNG MINH (AI TUTOR)</span>
          <h2>Hỏi đáp Bài học, Hướng dẫn Giải bài tập & Giải thích Code với EduMind AI</h2>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Left Sidebar: Conversations */}
        <div
          style={{
            background: "#f8fafc",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* New Chat Button */}
          <div style={{ padding: "14px", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={handleCreateNewConv}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
              }}
            >
              <Icon name="plus" size={14} /> Đoạn chat mới
            </button>

            {/* Tabs: Active vs Archived */}
            <div style={{ display: "flex", marginTop: "10px", background: "#e2e8f0", borderRadius: "6px", padding: "2px" }}>
              <button
                onClick={() => setActiveTab("active")}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: "5px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: activeTab === "active" ? 700 : 500,
                  background: activeTab === "active" ? "#ffffff" : "transparent",
                  color: activeTab === "active" ? "#1e293b" : "#64748b",
                  cursor: "pointer",
                }}
              >
                Hội thoại ({storageService.getConversations(currentUser.id, false).length})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: "5px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: activeTab === "archived" ? 700 : 500,
                  background: activeTab === "archived" ? "#ffffff" : "transparent",
                  color: activeTab === "archived" ? "#1e293b" : "#64748b",
                  cursor: "pointer",
                }}
              >
                Lưu trữ ({storageService.getConversations(currentUser.id, true).length})
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "11.5px" }}>
                {activeTab === "active" ? "Chưa có cuộc trò chuyện nào." : "Kho lưu trữ trống."}
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                const isEditing = editingConvId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (!isEditing) setActiveConv(c);
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: isSelected ? "#eef2ff" : "#ffffff",
                      border: isSelected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                      color: isSelected ? "#3730a3" : "#334155",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(c.id);
                            if (e.key === "Escape") setEditingConvId(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #6366f1",
                            fontSize: "11.5px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={(e) => handleSaveRename(c.id, e)}
                          title="Lưu tên mới"
                          style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 6px", cursor: "pointer" }}
                        >
                          <Icon name="check" size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConvId(null);
                          }}
                          title="Hủy"
                          style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "4px", padding: "4px 6px", cursor: "pointer" }}
                        >
                          <Icon name="x" size={11} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <Icon name="messageSquare" size={13} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
                            <strong
                              style={{
                                fontSize: "11.5px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.title}
                            </strong>
                          </div>

                          {/* Quick Action Icons: Rename, Archive, Delete */}
                          <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                            <button
                              onClick={(e) => handleStartRename(c, e)}
                              title="Đổi tên cuộc trò chuyện"
                              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "3px" }}
                            >
                              <Icon name="edit" size={11} />
                            </button>
                            <button
                              onClick={(e) => handleToggleArchive(c.id, e)}
                              title={c.isArchived ? "Khôi phục khỏi lưu trữ" : "Lưu trữ cuộc trò chuyện"}
                              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "3px" }}
                            >
                              <Icon name="archive" size={11} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConv(c.id, e)}
                              title="Xóa cuộc trò chuyện"
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "3px" }}
                            >
                              <Icon name="trash" size={11} />
                            </button>
                          </div>
                        </div>

                        <span style={{ fontSize: "9.5px", color: "#94a3b8" }}>
                          Cập nhật: {new Date(c.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · {new Date(c.updatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Window */}
        {activeConv ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Chat Top Banner */}
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  <Icon name="sparkles" size={16} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "13.5px", color: "#1e293b" }}>{activeConv.title}</strong>
                    {activeConv.isArchived && (
                      <span style={{ padding: "1px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", fontSize: "9px", fontWeight: 700 }}>
                        ĐÃ LƯU TRỮ
                      </span>
                    )}
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    EduMind AI sẵn sàng hỗ trợ bạn 24/7 (Độ trễ thấp & streaming)
                  </span>
                </div>
              </div>

              {/* History protection note (No edit rule compliance) */}
              <div style={{ fontSize: "10.5px", color: "#64748b", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                🔒 Tin nhắn đã gửi được bảo lưu nguyên trạng lịch sử
              </div>
            </div>

            {/* Messages Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                background: "#f8fafc",
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                      alignSelf: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "10px", color: "#94a3b8" }}>
                      <span>{isUser ? currentUser.name : "EduMind AI Tutor"}</span>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isUser ? "#4f46e5" : "#ffffff",
                        color: isUser ? "#ffffff" : "#1e293b",
                        border: isUser ? "none" : "1px solid #e2e8f0",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                        fontSize: "12.5px",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* AI Suggestions Chips (Without Edit button on message) */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            disabled={isStreaming || isTyping}
                            onClick={() => handleSend(sug)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "16px",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              border: "1px solid #c7d2fe",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              cursor: isStreaming || isTyping ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            💡 {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming Assistant Response */}
              {isStreaming && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    maxWidth: "82%",
                    alignSelf: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "10px", color: "#6366f1", fontWeight: 700 }}>
                    <Icon name="sparkles" size={12} />
                    <span>EduMind AI đang truyền dữ liệu trực tiếp...</span>
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "16px 16px 16px 4px",
                      background: "#ffffff",
                      color: "#1e293b",
                      border: "1.5px solid #818cf8",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.08)",
                      fontSize: "12.5px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {streamingContent}
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "14px",
                        background: "#4f46e5",
                        marginLeft: "4px",
                        verticalAlign: "middle",
                        animation: "pulse 0.8s infinite",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Thinking / Typing Indicator */}
              {isTyping && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "16px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    width: "fit-content",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <Icon name="sparkles" size={14} className="text-indigo-600 animate-spin" />
                  <span>EduMind AI đang phân tích dữ liệu & chuẩn bị câu trả lời...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                disabled={isStreaming || isTyping}
                placeholder={
                  isStreaming || isTyping
                    ? "Vui lòng chờ AI hoàn tất câu trả lời..."
                    : "Đặt câu hỏi về bài giảng, giải bài tập hoặc nhờ giải thích code..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isStreaming && !isTyping) handleSend();
                }}
                style={{
                  flex: 1,
                  padding: "10px 18px",
                  borderRadius: "24px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: isStreaming || isTyping ? "#f8fafc" : "#ffffff",
                }}
              />
              <button
                disabled={isStreaming || isTyping || !inputMessage.trim()}
                onClick={() => handleSend()}
                style={{
                  padding: "10px 20px",
                  borderRadius: "24px",
                  background: isStreaming || isTyping || !inputMessage.trim() ? "#cbd5e1" : "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: isStreaming || isTyping || !inputMessage.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                Gửi <Icon name="send" size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", placeItems: "center", padding: "40px", color: "#94a3b8" }}>
            Chọn một cuộc hội thoại hoặc bấm &quot;Đoạn chat mới&quot; để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}
