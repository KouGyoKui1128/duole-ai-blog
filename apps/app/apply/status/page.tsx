'use client'

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { queryApplicationStatus, type ApplicationStatusItem } from "@/lib/admin-api"

export default function ApplyStatusPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<ApplicationStatusItem | null>(null)
  const [searched, setSearched] = useState(false)

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSearched(false)
    setStatus(null)
    try {
      const data = await queryApplicationStatus(email)
      setStatus(data)
      setSearched(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "查询失败"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-muted/20">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>申请状态查询</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleQuery} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">申请邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "查询中..." : "查询状态"}</Button>
          </form>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {searched && !status ? (
            <p className="text-sm text-muted-foreground">未查询到该邮箱的申请记录。</p>
          ) : null}

          {status ? (
            <div className="rounded-md border border-border p-4 space-y-2 text-sm">
              <p>申请人: {status.username}</p>
              <p>状态: {status.status_label}</p>
              {status.status === "approved" && status.initial_password ? (
                <p>初始密码: {status.initial_password}</p>
              ) : null}
              {status.status === "approved" ? (
                <p className="text-muted-foreground">请使用初始密码登录后前往后台修改密码。</p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            <Link href="/admin/login" className="underline underline-offset-4">返回登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
