'use client'

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createArticle, getTags, uploadArticleImage, type TagItem } from "@/lib/admin-api"

export default function NewArticlePage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [readTime, setReadTime] = useState("8")
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([])
  const [error, setError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setError("加载标签失败"))
  }, [])

  const toggleTag = (slugValue: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slugValue) ? prev.filter((item) => item !== slugValue) : [...prev, slugValue]
    )
  }

  const handleSave = async (isPublic: boolean) => {
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
        is_public: isPublic,
      })
      router.push("/admin/articles")
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，可能 slug 重复")
    }
  }

  const insertMarkdownAtCursor = (markdown: string) => {
    const textarea = contentTextareaRef.current
    if (!textarea) {
      setContent((prev) => `${prev}${markdown}`)
      return
    }

    const start = textarea.selectionStart ?? content.length
    const end = textarea.selectionEnd ?? start
    const nextContent = `${content.slice(0, start)}${markdown}${content.slice(end)}`
    setContent(nextContent)

    requestAnimationFrame(() => {
      const cursor = start + markdown.length
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    setUploadingImage(true)
    try {
      const uploaded = await uploadArticleImage(file)
      const altText = imageAlt.trim() || file.name
      const textarea = contentTextareaRef.current
      const start = textarea?.selectionStart ?? content.length
      const needsLeadingNewline = start > 0 && content[start - 1] !== "\n"
      const markdown = `${needsLeadingNewline ? "\n" : ""}![${altText}](${uploaded.url})\n`
      insertMarkdownAtCursor(markdown)
      setImageAlt("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "图片上传失败"
      setError(message)
    } finally {
      setUploadingImage(false)
      if (event.target) {
        event.target.value = ""
      }
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
            <Input placeholder="留空则取发布当天，例如 2026-07-30" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
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
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="图片 alt 文本，例如：首页示意图"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              className="md:max-w-xs"
            />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
              {uploadingImage ? "上传中..." : "上传图片"}
            </Button>
            <span className="text-xs text-muted-foreground">可先填写 alt 文本，上传成功后会自动插入 Markdown 图片链接</span>
          </div>
          <Textarea ref={contentTextareaRef} className="min-h-[400px] font-mono text-sm" placeholder="在此输入 Markdown 内容..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={() => handleSave(true)}>发布</Button>
          <Button variant="outline" onClick={() => handleSave(false)}>保存草稿</Button>
          <Link href="/admin/articles"><Button variant="ghost">取消</Button></Link>
        </div>
      </div>
    </div>
  )
}
