import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { DevRoleSwitcher } from "@/components/ui/DevRoleSwitcher";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "EduMind AI | Smart Learning. Future Minds.",
  description: "Nền tảng học tập trực tuyến EduMind AI tích hợp Trợ lý AI và OCR.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduMind AI",
  },
  formatDetection: {
    telephone: false,
  },
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
            {process.env.NODE_ENV === "development" && <DevRoleSwitcher />}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
