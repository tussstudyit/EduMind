import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduMind AI | Không gian học tập",
  description: "Nền tảng học tập trực tuyến EduMind AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
