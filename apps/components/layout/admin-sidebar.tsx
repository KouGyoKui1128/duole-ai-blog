'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, FolderKanban, Tags, User, ChevronLeft, Users, ClipboardList, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { getMe, logout, type UserRole } from "@/lib/admin-api"

const sidebarLinks = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户", icon: Users },
  { href: "/admin/applications", label: "申请", icon: ClipboardList },
  { href: "/admin/articles", label: "文章", icon: FileText },
  { href: "/admin/projects", label: "项目", icon: FolderKanban },
  { href: "/admin/tags", label: "标签", icon: Tags },
  { href: "/admin/resume", label: "简历", icon: User },
  { href: "/admin/password", label: "修改密码", icon: KeyRound },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    getMe()
      .then((me) => setRole(me.role))
      .catch(() => setRole(null))
  }, [])

  const links = useMemo(() => {
    if (role === "admin") {
      return sidebarLinks
    }
    return sidebarLinks.filter((item) => !["/admin/users", "/admin/applications", "/admin/resume"].includes(item.href))
  }, [role])

  const handleLogout = async () => {
    await logout()
    window.location.href = "/admin/login"
  }

  return (
    <aside className={cn("border-r border-border bg-card transition-all duration-200 flex flex-col", collapsed ? "w-16" : "w-56")}>
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {!collapsed && <span className="font-semibold text-sm">管理</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-md hover:bg-accent" aria-label="Toggle sidebar">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => {
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
        {!collapsed && <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">返回网站</Link>}
        {!collapsed && (
          <button onClick={handleLogout} className="mt-2 block text-xs text-muted-foreground hover:text-foreground">
            退出登录
          </button>
        )}
      </div>
    </aside>
  )
}
