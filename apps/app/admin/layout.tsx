'use client'

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { getMe } from "@/lib/admin-api"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (pathname === "/admin/login") {
      return
    }

    getMe()
      .then(() => setChecking(false))
      .catch(() => {
        router.replace("/admin/login")
      })
  }, [pathname, router])

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (checking) {
    return <div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">正在检查登录状态...</div>
  }

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <main className="flex-1 bg-muted/20 overflow-auto">{children}</main>
    </div>
  )
}
