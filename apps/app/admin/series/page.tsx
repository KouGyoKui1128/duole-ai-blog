'use client'

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Save, Trash2 } from "lucide-react"

import { slugError } from "@/components/admin/slug-field"
import { useConfirmDelete } from "@/components/admin/use-confirm-delete"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  createSeries,
  deleteSeries,
  getSeriesList,
  updateSeries,
  type SeriesItem,
  type SeriesPayload,
} from "@/lib/admin-api"
import type { ArticleLanguage } from "@/lib/article-language"

const EMPTY_FORM: SeriesPayload = { title: "", slug: "", summary: "", language: "zh", sort: 0 }

function formError(form: SeriesPayload): string {
  if (!form.title.trim()) return "合集标题不能为空"
  if (!form.slug.trim()) return "slug 不能为空"
  return slugError(form.slug)
}

function SeriesForm({
  value,
  onChange,
  idPrefix,
  languageLocked,
}: {
  value: SeriesPayload
  onChange: (value: SeriesPayload) => void
  idPrefix: string
  languageLocked?: boolean
}) {
  const set = <K extends keyof SeriesPayload>(key: K, next: SeriesPayload[K]) => onChange({ ...value, [key]: next })
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_9rem_6rem]">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${idPrefix}-title`}>标题</label>
        <Input id={`${idPrefix}-title`} placeholder="例如 LangGraph 入门" value={value.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${idPrefix}-slug`}>Slug</label>
        <Input id={`${idPrefix}-slug`} placeholder="例如 langgraph-basics" value={value.slug} onChange={(e) => set("slug", e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${idPrefix}-language`}>语言</label>
        <select
          id={`${idPrefix}-language`}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-50"
          value={value.language}
          disabled={languageLocked}
          title={languageLocked ? "合集里已有文章，先把它们移出才能改语言" : undefined}
          onChange={(e) => set("language", e.target.value as ArticleLanguage)}
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${idPrefix}-sort`}>排序</label>
        <Input id={`${idPrefix}-sort`} type="number" value={String(value.sort)} onChange={(e) => set("sort", Number(e.target.value || "0"))} />
      </div>
      <div className="md:col-span-4">
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor={`${idPrefix}-summary`}>简介</label>
        <Input id={`${idPrefix}-summary`} placeholder="一句话说明这个合集讲什么（可选）" value={value.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>
    </div>
  )
}

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<SeriesPayload>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<SeriesPayload>(EMPTY_FORM)
  const [updating, setUpdating] = useState(false)

  const loadSeries = useCallback(
    () =>
      getSeriesList()
        .then(setSeries)
        .catch((err) => setError(err instanceof Error ? err.message : "加载合集失败"))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    getSeriesList()
      .then(setSeries)
      .catch((err) => setError(err instanceof Error ? err.message : "加载合集失败"))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    const problem = formError(form)
    if (problem) return setError(problem)
    setError("")
    setCreating(true)
    try {
      await createSeries({ ...form, slug: form.slug.trim() })
      setForm(EMPTY_FORM)
      await loadSeries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建合集失败")
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (item: SeriesItem) => {
    setEditingId(item.id)
    setEditForm({ title: item.title, slug: item.slug, summary: item.summary, language: item.language, sort: item.sort })
    setError("")
  }

  const handleUpdate = async () => {
    if (editingId === null) return
    const problem = formError(editForm)
    if (problem) return setError(problem)
    setError("")
    setUpdating(true)
    try {
      await updateSeries(editingId, { ...editForm, slug: editForm.slug.trim() })
      setEditingId(null)
      await loadSeries()
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新合集失败")
    } finally {
      setUpdating(false)
    }
  }

  const { askToDelete, deleteDialog } = useConfirmDelete<SeriesItem>({
    nameOf: (item) => item.title,
    remove: async (item) => {
      setError("")
      await deleteSeries(item.id)
      await loadSeries()
    },
    onError: setError,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">合集管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          合集是你给同一种语言的文章定的阅读顺序。在文章编辑页选择合集并填写第几篇；删除合集不会删除文章。
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-medium">新建合集</h2>
          <SeriesForm value={form} onChange={setForm} idPrefix="new-series" />
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4 mr-1" />{creating ? "保存中..." : "新建合集"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loading ? <p className="text-sm text-muted-foreground">正在加载合集...</p> : null}
          {!loading && series.length === 0 ? <p className="text-sm text-muted-foreground">还没有合集</p> : null}
          <div className="space-y-3">
            {series.map((item) =>
              editingId === item.id ? (
                <div key={item.id} className="space-y-3 py-2 border-b border-border last:border-0">
                  <SeriesForm value={editForm} onChange={setEditForm} idPrefix={`series-${item.id}`} languageLocked={item.article_count > 0} />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleUpdate} disabled={updating}>
                      <Save className="h-3.5 w-3.5 mr-1" />{updating ? "保存中..." : "保存"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={updating}>取消</Button>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.title}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.language === "en" ? "EN" : "中文"}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      /series/{item.slug} · {item.article_count} 篇 · 排序 {item.sort}
                      {item.summary ? ` · ${item.summary}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)} aria-label={`编辑《${item.title}》`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => askToDelete(item)}
                      aria-label={`删除《${item.title}》`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
      {deleteDialog}
    </div>
  )
}
