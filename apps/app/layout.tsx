import type { Metadata } from "next"
import "./globals.css"


export const metadata: Metadata = {
  title: "DuoLe Blog - AI Agent ????",
  description: "?? LangChain?LangGraph?AI Agent ????????????",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  )
}
