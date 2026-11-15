'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ArticleEditor, EMPTY_ARTICLE, articlePayload, type ArticleFields } from "@/components/admin/article-editor"
import { slugError } from "@/components/admin/slug-field"
import { Button } from "@/components/ui/button"
import { NoticeDialog } from "@/components/ui/confirm-dialog"
import { createArticle, getTags, type TagItem } from "@/lib/admin-api"

type SaveAction = "draft" | "publish"

export default function NewArticlePage() {
  const [fields, setFields] = useState<ArticleFields>(EMPTY_ARTICLE)
  const [tags, setTags] = useState<TagItem[]>([])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState<SaveAction | null>(null)
  const [saved, setSaved] = useState<{ action: SaveAction; id: number } | null>(null)
  const router = useRouter()

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setError("加载标签失败"))
  }, [])

  const handleSave = async (action: SaveAction) => {
    if (saving || saved) return
    setError("")
    setSaving(action)
    try {
      const article = await createArticle({ ...articlePayload(fields), is_public: action === "publish" })
      setFields((prev) => ({ ...prev, slug: article.slug }))
      setSaved({ action, id: article.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，可能 slug 重复")
    } finally {
      setSaving(null)
    }
  }

  // A saved draft reopens in the editor, so every later save updates it instead of creating another.
  const afterNotice = () => {
    if (!saved) return
    if (saved.action === "draft") router.replace(`/admin/articles/${saved.id}`)
    else router.push("/admin/articles")
  }

  const cannotSave = saving !== null || saved !== null || Boolean(slugError(fields.slug))

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles"><Button variant="ghost" size="icon" aria-label="返回文章列表"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">新建文章</h1>
      </div>
      <ArticleEditor
        value={fields}
        onChange={setFields}
        tags={tags}
        languageHint="决定文章显示在哪个栏目，发布后也能修改。"
        onError={setError}
      />
      {error ? <p className="text-sm text-destructive mt-4">{error}</p> : null}
      <div className="flex items-center gap-3 pt-8">
        <Button onClick={() => handleSave("publish")} disabled={cannotSave}>
          {saving === "publish" ? "保存中..." : "发布"}
        </Button>
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={cannotSave}>
          {saving === "draft" ? "保存中..." : "保存草稿"}
        </Button>
        <Link href="/admin/articles"><Button variant="ghost">取消</Button></Link>
      </div>
      <NoticeDialog
        open={saved !== null}
        title={saved?.action === "publish" ? "已发布" : "已保存为草稿"}
        onClose={afterNotice}
      />
    </div>
  )
}
