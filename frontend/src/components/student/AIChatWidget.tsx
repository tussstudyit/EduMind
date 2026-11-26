"use client";

import React, { useState } from "react";
import { AITutorView } from "@/components/student/AITutorView";
import { AuthModal } from "@/components/auth/AuthModal";
import { Icon } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";

export function AIChatWidget() {
  const { can, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const needsSignIn = !isAuthenticated && !can("use_ai_tutor");

  return (
    <>
      {isOpen && (
        <section id="ai-chat-widget-panel" className="ai-chat-widget-panel" role="dialog" aria-label="Trò chuyện với trợ lý học tập AI">
          {needsSignIn ? (
            <div className="ai-chat-widget-signin">
              <div className="ai-chat-widget-signin-icon"><Icon name="sparkles" size={22} /></div>
              <strong>Trò chuyện với EduMind AI</strong>
              <p>Đăng nhập để bắt đầu trò chuyện và lưu lịch sử học tập của bạn.</p>
              <button type="button" onClick={() => setIsAuthOpen(true)}>Đăng nhập</button>
            </div>
          ) : (
            <AITutorView compact onClose={() => setIsOpen(false)} />
          )}
        </section>
      )}
      <button
        className="ai-chat-widget-bubble"
        type="button"
        aria-label={isOpen ? "Đóng trò chuyện với AI" : "Mở trò chuyện với AI"}
        aria-expanded={isOpen}
        aria-controls="ai-chat-widget-panel"
        title={isOpen ? "Đóng trò chuyện" : "Trò chuyện với EduMind AI"}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name={isOpen ? "x" : "messageSquare"} size={isOpen ? 23 : 25} />
        {!isOpen && <span className="ai-chat-widget-badge">AI</span>}
      </button>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultTab="login" />
    </>
  );
}
