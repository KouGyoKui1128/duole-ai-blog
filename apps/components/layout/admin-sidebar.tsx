'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, FolderKanban, Tags, User, Settings, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const sidebarLinks = [
  { href: "/admin", label: "???", icon: LayoutDashboard },
  { href: "/admin/articles", label: "????", icon: FileText },
  { href: "/admin/projects", label: "????", icon: FolderKanban },
  { href: "/admin/tags", label: "????", icon: Tags },
  { href: "/admin/resume", label: "????", icon: User },
  { href: "/admin/settings", label: "????", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn("border-r border-border bg-card transition-all duration-200 flex flex-col", collapsed ? "w-16" : "w-56")}>
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {!collapsed && <span className="font-semibold text-sm">????</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-md hover:bg-accent" aria-label="Toggle sidebar">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">????</Link>
        )}
      </div>
    </aside>
  )
}
