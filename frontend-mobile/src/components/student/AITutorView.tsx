// ============================================================================
// EDUMIND AI - AI TUTOR CHAT COMPONENT (MODULE 9)
// Trợ lý học tập thông minh: Quản lý hội thoại, lịch sử tin nhắn & streaming response
// Quy tắc UI: Không có nút Edit trên tin nhắn để giữ nguyên tính toàn vẹn lịch sử
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Conversation, ChatMessage } from "@/types";
import { apiClient } from "@/services/apiClient";
import { storageService } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icons";

function renderInlineMarkdown(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} style={{ padding: "1px 4px", borderRadius: "4px", background: "#eef2ff", color: "#4338ca" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMessageContent(content: string): React.ReactNode[] {
  return content.split(/(```[^\n]*\n?[\s\S]*?```)/g).map((part, index) => {
    const codeBlock = part.match(/^```[^\n]*\n?([\s\S]*?)```$/);
    if (codeBlock) {
      return (
        <pre
          key={index}
          style={{
            maxWidth: "100%",
            overflowX: "auto",
            margin: "10px 0",
            padding: "12px",
            borderRadius: "8px",
            background: "#172033",
            color: "#f8fafc",
            fontSize: "11px",
            lineHeight: 1.55,
          }}
        >
          <code>{codeBlock[1]}</code>
        </pre>
      );
    }
    return <React.Fragment key={index}>{renderInlineMarkdown(part)}</React.Fragment>;
  });
}

interface AITutorViewProps {
  compact?: boolean;
  onClose?: () => void;
  initialPrompt?: string;
  initialCourseId?: string;
  initialConversationId?: string;
  onInitialPromptConsumed?: () => void;
  onInitialConversationConsumed?: () => void;
}

export function AITutorView({
  compact = false,
  onClose,
  initialPrompt,
  initialCourseId,
  initialConversationId,
  onInitialPromptConsumed,
  onInitialConversationConsumed,
}: AITutorViewProps) {
  const { currentUser } = useAuth();
  const { success, info, warning } = useToast();

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationCount, setActiveConversationCount] = useState(0);
  const [archivedConversationCount, setArchivedConversationCount] = useState(0);
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
  const [runtimeModelLabel, setRuntimeModelLabel] = useState<string>("gemini-3.8-flash (GEMINI)");

  useEffect(() => {
    let mounted = true;
    apiClient
      .getAiRuntimeStatus()
      .then((status) => {
        if (mounted && status?.modelName) {
          setRuntimeModelLabel(`${status.modelName} (${(status.provider || "gemini").toUpperCase()})`);
        }
      })
      .catch(() => {
        const localCfg = storageService.getAIConfig();
        if (mounted) {
          setRuntimeModelLabel(`${localCfg.modelName} (${localCfg.provider.toUpperCase()})`);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingPromptRef = useRef(initialPrompt?.trim() || "");
  const pendingCourseIdRef = useRef(initialCourseId);
  const pendingConversationIdRef = useRef(initialConversationId);
  const promptConsumedCallbackRef = useRef(onInitialPromptConsumed);
  const conversationConsumedCallbackRef = useRef(onInitialConversationConsumed);

  const stopCurrentResponse = () => {
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    sendTimerRef.current = null;
    streamTimerRef.current = null;
    setIsTyping(false);
    setIsStreaming(false);
    setStreamingContent("");
  };

  useEffect(() => {
    promptConsumedCallbackRef.current = onInitialPromptConsumed;
    conversationConsumedCallbackRef.current = onInitialConversationConsumed;
  }, [onInitialPromptConsumed, onInitialConversationConsumed]);

  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      try {
        const [activeList, archivedList] = await Promise.all([
          apiClient.getConversations(currentUser.id, false),
          apiClient.getConversations(currentUser.id, true),
        ]);
        if (cancelled) return;
        setActiveConversationCount(activeList.length);
        setArchivedConversationCount(archivedList.length);

        const allConversations = [...activeList, ...archivedList];
        const requestedConversation = pendingConversationIdRef.current
          ? allConversations.find((conversation) => conversation.id === pendingConversationIdRef.current)
          : undefined;
        let selected = requestedConversation;

        if (pendingPromptRef.current) {
          let promptConversation = requestedConversation || activeList[0];
          if (!promptConversation) {
            promptConversation = await apiClient.createConversation(
              currentUser.id,
              pendingCourseIdRef.current ? "Hỏi đáp bài học" : "Cuộc trò chuyện mới với AI Tutor",
              pendingCourseIdRef.current,
            );
          }
          const { userMsg, assistantMsg } = await apiClient.sendMessage(
            promptConversation.id,
            pendingPromptRef.current,
          );
          if (cancelled) return;
          setMessages(await apiClient.getMessages(promptConversation.id));
          setActiveConv(promptConversation);
          selected = promptConversation;
          pendingPromptRef.current = "";
          pendingCourseIdRef.current = undefined;
          promptConsumedCallbackRef.current?.();
          void userMsg;
          void assistantMsg;
        }

        const list = activeTab === "archived" ? archivedList : activeList;
        setConversations(list);
        if (!selected && pendingConversationIdRef.current) {
          selected = allConversations.find((conversation) => conversation.id === pendingConversationIdRef.current);
        }
        setActiveConv(selected || list[0] || null);
        if (pendingConversationIdRef.current && selected) {
          conversationConsumedCallbackRef.current?.();
        }
        pendingConversationIdRef.current = undefined;
      } catch (error) {
        if (!cancelled) {
          warning("Không tải được lịch sử trò chuyện", error instanceof Error ? error.message : "Vui lòng thử lại.");
          setConversations([]);
          setActiveConv(null);
        }
      }
    };

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, activeTab]);

  useEffect(() => {
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    if (activeConv) {
      let cancelled = false;
      void apiClient.getMessages(activeConv.id).then((loadedMessages) => {
        if (!cancelled) setMessages(loadedMessages);
      }).catch((error) => {
        if (!cancelled) warning("Không tải được tin nhắn", error instanceof Error ? error.message : "Vui lòng thử lại.");
      });
      return () => {
        cancelled = true;
        if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      };
    } else {
      setMessages([]);
    }

    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [activeConv?.id, warning]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isStreaming, streamingContent]);

  // Conversation Management Actions
  const handleCreateNewConv = async () => {
    stopCurrentResponse();
    try {
      const newConv = await apiClient.createConversation(currentUser.id, "Cuộc trò chuyện mới với AI Tutor");
      const list = await apiClient.getConversations(currentUser.id, false);
      setActiveConversationCount(list.length);
      setActiveTab("active");
      setConversations(list);
      setActiveConv(newConv);
      success("Đã tạo cuộc trò chuyện mới");
    } catch (error) {
      warning("Không tạo được cuộc trò chuyện", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = async (convId: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      const renamed = await apiClient.renameConversation(convId, editingTitle.trim());
      setEditingConvId(null);
      setConversations((items) => items.map((conversation) => conversation.id === convId ? renamed : conversation));
      if (activeConv?.id === convId) setActiveConv(renamed);
      info("Đã đổi tên cuộc trò chuyện");
    } catch (error) {
      warning("Không đổi được tên cuộc trò chuyện", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  const handleToggleArchive = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopCurrentResponse();
    try {
      await apiClient.toggleArchiveConversation(convId);
      const wasArchived = activeTab === "archived";
      info(wasArchived ? "Đã khôi phục hội thoại" : "Đã chuyển hội thoại vào lưu trữ");
      const [activeList, archivedList] = await Promise.all([
        apiClient.getConversations(currentUser.id, false),
        apiClient.getConversations(currentUser.id, true),
      ]);
      setActiveConversationCount(activeList.length);
      setArchivedConversationCount(archivedList.length);
      const list = wasArchived ? archivedList : activeList;
      setConversations(list);
      if (!list.some((conversation) => conversation.id === activeConv?.id)) {
        setActiveConv(list[0] || null);
      }
    } catch (error) {
      warning("Không cập nhật được trạng thái lưu trữ", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  const handleDeleteConv = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này khỏi lịch sử? Hành động này không thể hoàn tác.")) {
      stopCurrentResponse();
      try {
        await apiClient.deleteConversation(convId);
        info("Đã xóa cuộc trò chuyện");
        const [activeList, archivedList] = await Promise.all([
          apiClient.getConversations(currentUser.id, false),
          apiClient.getConversations(currentUser.id, true),
        ]);
        setActiveConversationCount(activeList.length);
        setArchivedConversationCount(archivedList.length);
        const list = activeTab === "archived" ? archivedList : activeList;
        setConversations(list);
        if (!list.some((conversation) => conversation.id === activeConv?.id)) setActiveConv(list[0] || null);
      } catch (error) {
        warning("Không xóa được cuộc trò chuyện", error instanceof Error ? error.message : "Vui lòng thử lại.");
      }
    }
  };

  // Sending and Simulated Streaming
  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !activeConv || activeConv.isArchived || isTyping || isStreaming) return;

    setInputMessage("");
    setIsTyping(true);
    try {
      const { userMsg, assistantMsg, modelUsed, providerUsed } = await apiClient.sendMessage(activeConv.id, text.trim());
      if (modelUsed) {
        setRuntimeModelLabel(`${modelUsed} (${(providerUsed || "gemini").toUpperCase()})`);
      }
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(false);
      setIsStreaming(true);
      setStreamingContent("");

      const fullReply = assistantMsg.content;
      let currentIndex = 0;
      streamTimerRef.current = setInterval(() => {
        currentIndex += Math.floor(Math.random() * 3) + 2;
        if (currentIndex >= fullReply.length) {
          if (streamTimerRef.current) clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
          setStreamingContent("");
          setIsStreaming(false);
          setMessages((prev) => [...prev, assistantMsg]);
          void Promise.all([
            apiClient.getConversations(currentUser.id, false),
            apiClient.getConversations(currentUser.id, true),
          ]).then(([activeList, archivedList]) => {
            setActiveConversationCount(activeList.length);
            setArchivedConversationCount(archivedList.length);
            setConversations(activeTab === "archived" ? archivedList : activeList);
          });
        } else {
          setStreamingContent(fullReply.substring(0, currentIndex));
        }
      }, 22);
    } catch (error) {
      setIsTyping(false);
      warning("Không gửi được tin nhắn", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  return (
    <div className={compact ? "ai-tutor-view ai-tutor-view-compact" : "ai-tutor-view"}>
      {/* Header */}
      {!compact && <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <span className="eyebrow">MODULE 9: TRỢ LÝ HỌC TẬP THÔNG MINH (AI TUTOR)</span>
          <h2>Hỏi đáp Bài học, Hướng dẫn Giải bài tập & Giải thích Code với EduMind AI</h2>
        </div>
      </div>}

      {/* Main Container */}
      <div
        className="ai-tutor-layout"
        style={{
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
          gridTemplateColumns: compact ? "minmax(0, 1fr)" : undefined,
        }}
      >
        {/* Left Sidebar: Conversations */}
        {!compact && <div
          className="ai-tutor-sidebar"
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
                onClick={() => {
                  stopCurrentResponse();
                  setActiveTab("active");
                }}
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
                Hội thoại ({activeConversationCount})
              </button>
              <button
                onClick={() => {
                  stopCurrentResponse();
                  setActiveTab("archived");
                }}
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
                Lưu trữ ({archivedConversationCount})
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
                      if (!isEditing && activeConv?.id !== c.id) {
                        stopCurrentResponse();
                        setActiveConv(c);
                      }
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
        </div>}

        {/* Right Main Chat Window */}
        {activeConv ? (
          <div className="ai-tutor-window" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
            {/* Chat Top Banner */}
            <div
              style={{
                padding: compact ? "10px 12px" : "12px 20px",
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
                    <strong style={{ fontSize: compact ? "12px" : "13.5px", color: "#1e293b" }}>{compact ? "Trợ lý học tập AI" : activeConv.title}</strong>
                    {activeConv.isArchived && (
                      <span style={{ padding: "1px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", fontSize: "9px", fontWeight: 700 }}>
                        ĐÃ LƯU TRỮ
                      </span>
                    )}
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#0e7490", fontWeight: 600 }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06b6d4", display: "inline-block" }} />
                    {compact ? activeConv.title : `Đang kết nối mô hình: ${runtimeModelLabel} · RAG & Lịch sử đồng bộ`}
                  </span>
                </div>
              </div>

              {/* History protection note (No edit rule compliance) */}
              {compact ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <button type="button" aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới" onClick={handleCreateNewConv} style={widgetHeaderButtonStyle}>
                    <Icon name="plus" size={15} />
                  </button>
                  {onClose && <button type="button" aria-label="Đóng khung chat" title="Đóng khung chat" onClick={onClose} style={widgetHeaderButtonStyle}>
                    <Icon name="x" size={15} />
                  </button>}
                </div>
              ) : (
                <div className="ai-tutor-history-note" style={{ fontSize: "10.5px", color: "#64748b", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  🔒 Tin nhắn đã gửi được bảo lưu nguyên trạng lịch sử
                </div>
              )}
            </div>

            {/* Messages Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: compact ? "12px" : "20px",
                display: "flex",
                flexDirection: "column",
                gap: compact ? "12px" : "16px",
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
                      {renderMessageContent(msg.content)}
                    </div>

                    {/* AI Suggestions Chips (Without Edit button on message) */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            disabled={activeConv.isArchived || isStreaming || isTyping}
                            onClick={() => handleSend(sug)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "16px",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              border: "1px solid #c7d2fe",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              cursor: activeConv.isArchived || isStreaming || isTyping ? "not-allowed" : "pointer",
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
                    {renderMessageContent(streamingContent)}
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
                padding: compact ? "10px 10px" : "14px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                gap: compact ? "6px" : "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                disabled={activeConv.isArchived || isStreaming || isTyping}
                placeholder={
                  activeConv.isArchived
                    ? "Hội thoại đã lưu trữ — khôi phục để tiếp tục nhắn tin"
                    : isStreaming || isTyping
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
                  padding: compact ? "9px 12px" : "10px 18px",
                  borderRadius: "24px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: activeConv.isArchived || isStreaming || isTyping ? "#f8fafc" : "#ffffff",
                }}
              />
              <button
                disabled={activeConv.isArchived || isStreaming || isTyping || !inputMessage.trim()}
                onClick={() => handleSend()}
                style={{
                  padding: compact ? "9px 13px" : "10px 20px",
                  borderRadius: "24px",
                  background: activeConv.isArchived || isStreaming || isTyping || !inputMessage.trim() ? "#cbd5e1" : "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: activeConv.isArchived || isStreaming || isTyping || !inputMessage.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                Gửi <Icon name="send" size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", placeItems: "center", alignContent: "center", gap: "12px", padding: "24px", color: "#64748b", textAlign: "center", fontSize: "12px" }}>
            <Icon name="sparkles" size={24} />
            <span>{compact ? "Bắt đầu trò chuyện với trợ lý học tập AI." : "Chọn một cuộc hội thoại hoặc bấm “Đoạn chat mới” để bắt đầu."}</span>
            {compact && <button type="button" onClick={handleCreateNewConv} style={{ padding: "9px 14px", border: 0, borderRadius: "8px", background: "#4f46e5", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Bắt đầu trò chuyện</button>}
          </div>
        )}
      </div>
    </div>
  );
}

const widgetHeaderButtonStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  display: "grid",
  placeItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  cursor: "pointer",
};
