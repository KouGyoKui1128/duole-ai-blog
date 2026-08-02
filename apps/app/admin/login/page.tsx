'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PenLine } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { login } from "@/lib/admin-api"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/admin")
    } catch (err) {
      const message = err instanceof Error ? err.message : "登录失败，请检查邮箱和密码"
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setError("无法连接后端服务，请确认 8000 端口后端已启动")
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-muted/20">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><PenLine className="h-8 w-8" /></div>
          <CardTitle>后台登录</CardTitle>
          <CardDescription>使用管理员或编辑账号登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "登录中..." : "登录"}</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">初始管理员账号: admin@duole.ai / Admin@123456</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
            <Link href="/apply" className="underline underline-offset-4">申请加入</Link>
            <Link href="/apply/status" className="underline underline-offset-4">申请状态查询</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
