import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TechCat } from "@/components/blog/tech-cat"


export const metadata: Metadata = {
  title: "DuoLe Blog - AI Agent 博客",
  description: "包含 LangChain、LangGraph 与 AI Agent 相关的学习笔记与技术分享",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          {children}
          <TechCat />
        </ThemeProvider>
      </body>
    </html>
  )
}
