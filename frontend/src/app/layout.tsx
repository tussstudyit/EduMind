import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { DevRoleSwitcher } from "@/components/ui/DevRoleSwitcher";

export const metadata: Metadata = {
  title: "EduMind AI | Hệ thống Quản lý Học tập LMS Thông minh",
  description: "Nền tảng học tập trực tuyến EduMind AI tích hợp Trợ lý AI và OCR.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            {/* Thanh chuyển đổi vai trò nhanh (Dev Role Switcher) */}
            <DevRoleSwitcher />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
