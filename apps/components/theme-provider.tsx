'use client'

import { Monitor, Moon, Sun } from "lucide-react"
import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "system" | "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "duole-theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    if (storedTheme === "system" || storedTheme === "light" || storedTheme === "dark") {
      setThemeState(storedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system")
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor
  const label = theme === "dark" ? "切换到系统主题" : theme === "light" ? "切换到深色主题" : "切换到浅色主题"

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
