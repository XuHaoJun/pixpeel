import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixpeel — 圖片裁切與縮放工具",
  description: "輕量的前端圖片處理工具，支援裁切、自動裁切與三種縮放策略",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
