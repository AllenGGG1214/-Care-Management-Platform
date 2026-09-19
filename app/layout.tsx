import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "安居 · 养老服务平台",
  description: "老人档案、膳食计划与食堂运营管理",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
