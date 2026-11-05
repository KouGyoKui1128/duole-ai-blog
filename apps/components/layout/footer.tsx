import Link from "next/link"

export function Footer() {
  return (
    <footer className="foot mt-auto">
      <div className="wrap">
        <span>&copy; {new Date().getFullYear()} DuoLe</span>
        <span>Next.js 与 FastAPI 构建</span>
        <Link href="/admin/login">管理后台</Link>
      </div>
    </footer>
  )
}
