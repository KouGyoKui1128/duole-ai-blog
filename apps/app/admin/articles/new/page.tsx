'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tags } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewArticlePage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const router = useRouter()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">新建文章</h1>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">标题</label>
          <Input placeholder="输入文章标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">摘要</label>
          <Input placeholder="文章摘要（可选）" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">标签</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.slug} variant="outline" className="cursor-pointer">{tag.name}</Badge>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">内容 (Markdown)</label>
          <Textarea className="min-h-[400px] font-mono text-sm" placeholder="在此输入 Markdown 内容..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={() => router.push("/admin/articles")}>保存</Button>
          <Button variant="outline">预览</Button>
          <Link href="/admin/articles"><Button variant="ghost">取消</Button></Link>
        </div>
      </div>
    </div>
  )
}
