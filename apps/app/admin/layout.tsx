import { AdminSidebar } from "@/components/layout/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <main className="flex-1 bg-muted/20 overflow-auto">{children}</main>
    </div>
  )
}
