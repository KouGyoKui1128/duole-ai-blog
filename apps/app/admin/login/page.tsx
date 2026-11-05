'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PenLine } from "lucide-react"
import { useRouter } from "next/navigation"
import { getTags, login } from "@/lib/admin-api"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Start waking the free backend while the author types.
  useEffect(() => {
    getTags().catch(() => undefined)
  }, [])

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
        setError("暂时连不上后端，它可能正在唤醒，请约一分钟后重试")
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
          <CardDescription>仅限作者登录</CardDescription>
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
        </CardContent>
      </Card>
    </div>
  )
}
