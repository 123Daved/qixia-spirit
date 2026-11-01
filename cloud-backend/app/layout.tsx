import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "栖霞有灵 · 云端服务",
  description: "栖霞有灵的云端对话与旅行记忆服务。",
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
