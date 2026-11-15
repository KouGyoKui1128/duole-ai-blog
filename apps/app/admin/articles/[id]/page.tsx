'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ArticleEditor, articlePayload, fieldsFromArticle, type ArticleFields } from "@/components/admin/article-editor"
import { slugError } from "@/components/admin/slug-field"
import { useConfirmDelete } from "@/components/admin/use-confirm-delete"
import { Button } from "@/components/ui/button"
import { NoticeDialog } from "@/components/ui/confirm-dialog"
import { deleteArticle, getArticle, getTags, updateArticle, type ArticleItem, type TagItem } from "@/lib/admin-api"

export default function EditArticlePage() {
  const params = useParams()
  const articleId = Number(params.id)
  const [article, setArticle] = useState<ArticleItem | null>(null)
  const [fields, setFields] = useState<ArticleFields | null>(null)
  const [tags, setTags] = useState<TagItem[]>([])
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    Promise.all([getArticle(articleId), getTags()])
      .then(([found, allTags]) => {
        setTags(allTags)
        setArticle(found)
        setFields(fieldsFromArticle(found))
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "加载文章失败"))
  }, [articleId])

  const handleSave = async () => {
    if (!article || !fields || saving || saved) return
    setError("")
    setSaving(true)
    try {
      await updateArticle(article.id, articlePayload(fields))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const { askToDelete, deleteDialog } = useConfirmDelete<ArticleItem>({
    nameOf: (item) => item.title,
    remove: async (item) => {
      setError("")
      await deleteArticle(item.id)
      router.push("/admin/articles")
    },
    onError: setError,
  })

  if (loadError) return <div className="p-6 text-sm text-destructive">{loadError}</div>
  if (!article || !fields) return <div className="p-6">正在加载文章...</div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles"><Button variant="ghost" size="icon" aria-label="返回文章列表"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <span className="text-xs text-muted-foreground">{article.is_public ? "已发布" : "草稿"}</span>
      </div>
      <ArticleEditor
        value={fields}
        onChange={setFields}
        tags={tags}
        languageHint="修改语言会改变文章地址，旧地址将不再可用。"
        onError={setError}
      />
      {error ? <p className="text-sm text-destructive mt-4">{error}</p> : null}
      <div className="flex items-center gap-3 pt-8">
        <Button onClick={handleSave} disabled={saving || saved || Boolean(slugError(fields.slug))}>
          {saving ? "保存中..." : "保存"}
        </Button>
        <Button variant="destructive" onClick={() => askToDelete(article)} disabled={saving}>删除</Button>
        <Link href="/admin/articles"><Button variant="ghost">取消</Button></Link>
      </div>
      <NoticeDialog open={saved} title="保存成功" onClose={() => router.push("/admin/articles")} />
      {deleteDialog}
    </div>
  )
}
