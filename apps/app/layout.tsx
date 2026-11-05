import type { Metadata } from "next"
import { Geist, Geist_Mono, Newsreader, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"

import "./globals.css"
import "./site.css"
import { TechCat } from "@/components/blog/tech-cat"
import { Toast } from "@/components/site/toast"
import { ThemeProvider } from "@/components/theme-provider"

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
})
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

// Chinese fonts are split by unicode-range, so the browser fetches only the
// slices a page uses. Preloading would pull them in before they are needed.
const notoSerifSc = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["500", "600"],
  preload: false,
  variable: "--font-noto-serif-sc",
})
const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
  variable: "--font-noto-sans-sc",
})

const fontVariables = [newsreader, geist, geistMono, notoSerifSc, notoSansSc].map((font) => font.variable).join(" ")

// Runs before first paint so a saved light theme never flashes dark.
const themeScript = `try{if(localStorage.getItem("duole-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`

export const metadata: Metadata = {
  title: { default: "DuoLe 个人站", template: "%s · DuoLe" },
  description: "AI Agent 项目、LangChain 与 LangGraph 学习笔记，以及我的简历",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          {children}
          <Toast />
          <TechCat />
        </ThemeProvider>
      </body>
    </html>
  )
}
