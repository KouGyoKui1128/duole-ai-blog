'use client'

import { useRef, useState } from "react"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Strikethrough,
  type LucideIcon,
} from "lucide-react"

import { SlugField } from "@/components/admin/slug-field"
import { MarkdownContent } from "@/components/blog/markdown-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { uploadArticleImage, type ArticleItem, type TagItem } from "@/lib/admin-api"
import type { ArticleLanguage } from "@/lib/article-language"
import { applyMarkdownFormat, type Edit, type MarkdownFormat } from "@/lib/markdown-format"
import { cn } from "@/lib/utils"

/** What the author types; numbers stay strings until they are saved. */
export interface ArticleFields {
  title: string
  slug: string
  summary: string
  content: string
  publishedAt: string
  readTime: string
  tagSlugs: string[]
  language: ArticleLanguage
}

export const EMPTY_ARTICLE: ArticleFields = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  publishedAt: "",
  readTime: "8",
  tagSlugs: [],
  language: "zh",
}

export function fieldsFromArticle(article: ArticleItem): ArticleFields {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    publishedAt: article.published_at,
    readTime: String(article.read_time),
    tagSlugs: article.tags.map((tag) => tag.slug),
    language: article.language,
  }
}

export function articlePayload(fields: ArticleFields) {
  return {
    title: fields.title,
    slug: fields.slug.trim(),
    summary: fields.summary,
    content: fields.content,
    published_at: fields.publishedAt,
    read_time: Number(fields.readTime || "0"),
    tag_slugs: fields.tagSlugs,
    language: fields.language,
  }
}

const TOOLBAR: { format: MarkdownFormat; label: string; icon: LucideIcon; shortcut?: string }[] = [
  { format: "h2", label: "二级标题", icon: Heading2 },
  { format: "h3", label: "三级标题", icon: Heading3 },
  { format: "bold", label: "加粗", icon: Bold, shortcut: "Ctrl+B" },
  { format: "italic", label: "斜体", icon: Italic, shortcut: "Ctrl+I" },
  { format: "strike", label: "删除线", icon: Strikethrough },
  { format: "quote", label: "引用", icon: Quote },
  { format: "code", label: "行内代码", icon: Code },
  { format: "codeblock", label: "代码块", icon: SquareCode },
  { format: "link", label: "链接", icon: LinkIcon },
  { format: "ol", label: "有序列表", icon: ListOrdered },
  { format: "ul", label: "无序列表", icon: List },
]

const SHORTCUTS: Record<string, MarkdownFormat> = { b: "bold", i: "italic" }

interface ArticleEditorProps {
  value: ArticleFields
  onChange: (value: ArticleFields) => void
  tags: TagItem[]
  /** Shown under the language picker; it differs between a new and an existing article. */
  languageHint: string
  onError: (message: string) => void
}

/** The article form shared by the new and edit pages; the pages own loading and saving. */
export function ArticleEditor({ value, onChange, tags, languageHint, onError }: ArticleEditorProps) {
  const set = <K extends keyof ArticleFields>(key: K, next: ArticleFields[K]) => onChange({ ...value, [key]: next })

  const toggleTag = (slug: string) =>
    set("tagSlugs", value.tagSlugs.includes(slug) ? value.tagSlugs.filter((item) => item !== slug) : [...value.tagSlugs, slug])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="article-title">标题</label>
        <Input id="article-title" placeholder="输入文章标题" value={value.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <SlugField value={value.slug} onChange={(slug) => set("slug", slug)} />
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="article-summary">摘要</label>
        <Input id="article-summary" placeholder="文章摘要（可选）" value={value.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="article-date">发布日期</label>
          <Input
            id="article-date"
            placeholder="留空则取发布当天，例如 2026-07-30"
            value={value.publishedAt}
            onChange={(e) => set("publishedAt", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="article-read-time">阅读时长(分钟)</label>
          <Input id="article-read-time" type="number" min="0" value={value.readTime} onChange={(e) => set("readTime", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="article-language">语言</label>
        <select
          id="article-language"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={value.language}
          onChange={(e) => set("language", e.target.value as ArticleLanguage)}
        >
          <option value="zh">中文（显示在博客）</option>
          <option value="en">English（显示在 English 栏目）</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">{languageHint}</p>
      </div>
      <div>
        <span className="text-sm font-medium mb-1 block">标签</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag.slug}
              variant={value.tagSlugs.includes(tag.slug) ? "secondary" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.slug)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
      <MarkdownEditor
        content={value.content}
        language={value.language}
        onChange={(content) => set("content", content)}
        onError={onError}
      />
    </div>
  )
}

interface MarkdownEditorProps {
  content: string
  language: ArticleLanguage
  onChange: (content: string) => void
  onError: (message: string) => void
}

function MarkdownEditor({ content, language, onChange, onError }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [imageAlt, setImageAlt] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const currentSelection = (): Edit => {
    const textarea = textareaRef.current
    return {
      text: content,
      selectionStart: textarea?.selectionStart ?? content.length,
      selectionEnd: textarea?.selectionEnd ?? content.length,
    }
  }

  const applyEdit = (edit: Edit) => {
    onChange(edit.text)
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    })
  }

  const format = (kind: MarkdownFormat) => applyEdit(applyMarkdownFormat(currentSelection(), kind))

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
    const kind = SHORTCUTS[event.key.toLowerCase()]
    if (!kind) return
    event.preventDefault()
    format(kind)
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    // Read the cursor before the upload; the author may click elsewhere while it runs.
    const { selectionStart, selectionEnd } = currentSelection()
    setUploadingImage(true)
    try {
      const uploaded = await uploadArticleImage(file)
      const altText = imageAlt.trim() || file.name
      const needsLeadingNewline = selectionStart > 0 && content[selectionStart - 1] !== "\n"
      const markdown = `${needsLeadingNewline ? "\n" : ""}![${altText}](${uploaded.url})\n`
      const cursor = selectionStart + markdown.length
      applyEdit({
        text: content.slice(0, selectionStart) + markdown + content.slice(selectionEnd),
        selectionStart: cursor,
        selectionEnd: cursor,
      })
      setImageAlt("")
    } catch (err) {
      onError(err instanceof Error ? err.message : "图片上传失败")
    } finally {
      setUploadingImage(false)
      input.value = ""
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor="article-content">内容 (Markdown)</label>
        <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="编辑或预览">
          {(["edit", "preview"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                mode === item ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item === "edit" ? "编辑" : "预览"}
            </button>
          ))}
        </div>
      </div>

      {mode === "edit" ? (
        <>
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
            <span className="text-xs text-muted-foreground">可先填写 alt 文本，上传成功后会在光标处插入 Markdown 图片链接</span>
          </div>
          <div
            className="flex flex-wrap gap-0.5 rounded-t-md border border-b-0 border-border bg-muted/40 p-1"
            role="toolbar"
            aria-label="Markdown 格式"
            aria-controls="article-content"
          >
            {TOOLBAR.map(({ format: kind, label, icon: Icon, shortcut }) => (
              <Button
                key={kind}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={shortcut ? `${label} (${shortcut})` : label}
                aria-label={label}
                // Keep the textarea's selection: a mousedown on the button would otherwise blur it first.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => format(kind)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <Textarea
            id="article-content"
            ref={textareaRef}
            className="min-h-[400px] rounded-t-none font-mono text-sm"
            placeholder="在此输入 Markdown 内容..."
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            // The upload splices into the text it started from, so typing meanwhile would be lost.
            readOnly={uploadingImage}
          />
        </>
      ) : (
        <div className="min-h-[400px] rounded-md border border-border bg-background px-6 py-5">
          {content.trim() ? (
            <MarkdownContent content={content} language={language} />
          ) : (
            <p className="text-sm text-muted-foreground">还没有内容</p>
          )}
        </div>
      )}
    </div>
  )
}
