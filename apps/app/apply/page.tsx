'use client'

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createApplication } from "@/lib/admin-api"

export default function ApplyPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [motivation, setMotivation] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      await createApplication({ username, email, requested_role: "editor", motivation })
      setMessage("申请已提交，等待管理员审核。")
      setUsername("")
      setEmail("")
      setMotivation("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-muted/20">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>加入申请</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>申请角色</Label>
              <Input value="editor" readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">申请说明</Label>
              <Textarea id="motivation" value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <Button type="submit" disabled={loading}>
              {loading ? "提交中..." : "提交申请"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            已提交过申请? <Link href="/apply/status" className="underline underline-offset-4">查询申请状态</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}