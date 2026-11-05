'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { CommandPalette } from "@/components/site/command-palette"
import { useTheme } from "@/components/theme-provider"

const navLinks = [
  { href: "/blog", label: "博客" },
  { href: "/projects", label: "项目" },
  { href: "/resume", label: "简历" },
]

export function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={stuck ? "top stuck" : "top"}>
      <div className="wrap">
        <Link className="brand" href="/">Duo<i>Le</i></Link>
        <nav className="nav" aria-label="主导航">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          <div className="tools">
            <CommandPalette />
            <button
              className="tool"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
