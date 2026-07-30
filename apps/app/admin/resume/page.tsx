'use client'

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getResume, updateResume, type ResumeItem } from "@/lib/admin-api"

export default function AdminResumePage() {
  const [resume, setResume] = useState<ResumeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadResume = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getResume()
      setResume(data)
    } catch {
      setError("加载简历失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResume()
  }, [])

  const setField = (key: keyof ResumeItem, value: string) => {
    setResume((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = async () => {
    if (!resume) return
    setError("")
    try {
      await updateResume({
        name: resume.name,
        title: resume.title,
        bio: resume.bio,
        email: resume.email,
        github: resume.github,
        website: resume.website,
        skills: resume.skills,
        experience: resume.experience,
        education: resume.education,
      })
      await loadResume()
    } catch {
      setError("保存失败，可能没有权限")
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">正在加载简历...</div>
  if (!resume) return <div className="p-6 text-sm text-destructive">未找到简历数据</div>

  const r = resume
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">简历管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadResume}>重置</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium block mb-1">姓名</label><Input value={r.name} onChange={(e) => setField("name", e.target.value)} /></div>
            <div><label className="text-sm font-medium block mb-1">职称</label><Input value={r.title} onChange={(e) => setField("title", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium block mb-1">简介</label><Textarea value={r.bio} onChange={(e) => setField("bio", e.target.value)} /></div>
            <div><label className="text-sm font-medium block mb-1">邮箱</label><Input value={r.email} onChange={(e) => setField("email", e.target.value)} /></div>
            <div><label className="text-sm font-medium block mb-1">GitHub</label><Input value={r.github} onChange={(e) => setField("github", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">工作经历</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {r.experience.map((exp, i) => (
              <div key={i} className="p-3 border border-border rounded-lg">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={exp.company}
                    placeholder="公司"
                    onChange={(e) => setResume((prev) => {
                      if (!prev) return prev
                      const next = [...prev.experience]
                      next[i] = { ...next[i], company: e.target.value }
                      return { ...prev, experience: next }
                    })}
                  />
                  <Input
                    value={exp.role}
                    placeholder="职位"
                    onChange={(e) => setResume((prev) => {
                      if (!prev) return prev
                      const next = [...prev.experience]
                      next[i] = { ...next[i], role: e.target.value }
                      return { ...prev, experience: next }
                    })}
                  />
                  <Input
                    value={exp.period}
                    placeholder="任职时间"
                    onChange={(e) => setResume((prev) => {
                      if (!prev) return prev
                      const next = [...prev.experience]
                      next[i] = { ...next[i], period: e.target.value }
                      return { ...prev, experience: next }
                    })}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      value={exp.description}
                      placeholder="工作描述"
                      onChange={(e) => setResume((prev) => {
                        if (!prev) return prev
                        const next = [...prev.experience]
                        next[i] = { ...next[i], description: e.target.value }
                        return { ...prev, experience: next }
                      })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">技能</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {r.skills.flatMap(g => g.items).map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
