'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { tags } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createArticle } from "@/lib/admin-api"

export default function NewArticlePage() {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [readTime, setReadTime] = useState("8")
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([])
  const [error, setError] = useState("")
  const router = useRouter()

  const toggleTag = (slugValue: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slugValue) ? prev.filter((item) => item !== slugValue) : [...prev, slugValue]
    )
  }

  const handleSave = async () => {
    setError("")
    try {
      await createArticle({
        title,
        slug,
        summary,
        content,
        published_at: publishedAt,
        read_time: Number(readTime || "0"),
        tag_slugs: selectedTagSlugs,
      })
      router.push("/admin/articles")
    } catch {
      setError("保存失败，可能没有权限或 slug 重复")
    }
  }

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
          <label className="text-sm font-medium mb-1 block">Slug</label>
          <Input placeholder="例如: my-first-post" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">摘要</label>
          <Input placeholder="文章摘要（可选）" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">发布日期</label>
            <Input placeholder="2026-07-30" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">阅读时长(分钟)</label>
            <Input type="number" min="0" value={readTime} onChange={(e) => setReadTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">标签</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.slug}
                variant={selectedTagSlugs.includes(tag.slug) ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.slug)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">内容 (Markdown)</label>
          <Textarea className="min-h-[400px] font-mono text-sm" placeholder="在此输入 Markdown 内容..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave}>保存</Button>
          <Link href="/admin/articles"><Button variant="ghost">取消</Button></Link>
        </div>
      </div>
    </div>
  )
}
