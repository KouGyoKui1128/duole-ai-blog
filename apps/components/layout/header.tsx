'use client'

import Link from "next/link"
import { useState } from "react"
import { Menu, X, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "??" },
  { href: "/blog", label: "??" },
  { href: "/projects", label: "??" },
  { href: "/resume", label: "??" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <PenLine className="h-5 w-5" />
          <span>DuoLe Blog</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/admin/login">
            <Button variant="outline" size="sm">??</Button>
          </Link>
        </nav>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-2 bg-background">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin/login" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" size="sm" className="w-full">??</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
