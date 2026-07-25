'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resumeData } from "@/lib/mock-data"

export default function AdminResumePage() {
  const r = resumeData
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">简历管理</h1>
        <div className="flex gap-2">
          <Button variant="outline">重置</Button>
          <Button>保存</Button>
        </div>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium block mb-1">姓名</label><Input defaultValue={r.name} /></div>
            <div><label className="text-sm font-medium block mb-1">职称</label><Input defaultValue={r.title} /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium block mb-1">简介</label><Textarea defaultValue={r.bio} /></div>
            <div><label className="text-sm font-medium block mb-1">邮箱</label><Input defaultValue={r.email} /></div>
            <div><label className="text-sm font-medium block mb-1">GitHub</label><Input defaultValue={r.github} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">工作经历</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {r.experience.map((exp, i) => (
              <div key={i} className="p-3 border border-border rounded-lg">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input defaultValue={exp.company} placeholder="公司" />
                  <Input defaultValue={exp.role} placeholder="职位" />
                  <Input defaultValue={exp.period} placeholder="任职时间" />
                  <div className="sm:col-span-2"><Textarea defaultValue={exp.description} placeholder="工作描述" /></div>
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
