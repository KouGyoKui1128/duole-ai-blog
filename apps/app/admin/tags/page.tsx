'use client'

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Save, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
  type TagItem,
} from "@/lib/admin-api"

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [color, setColor] = useState("#22c55e")

  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingSlug, setEditingSlug] = useState("")
  const [editingColor, setEditingColor] = useState("#22c55e")

  const loadingText = useMemo(() => (loading ? "正在加载标签..." : ""), [loading])

  const fetchTags = () =>
    getTags()
      .then((data) => {
        setTags(data)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "加载标签失败"
        setError(message)
      })
      .finally(() => {
        setLoading(false)
      })

  const loadTags = async () => {
    setLoading(true)
    setError("")
    await fetchTags()
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleCreate = async () => {
    const nextName = name.trim()
    const nextSlug = slugify(slug || name)
    if (!nextName || !nextSlug) {
      setError("标签名称和 slug 不能为空")
      return
    }
    setError("")
    try {
      await createTag({
        name: nextName,
        slug: nextSlug,
        color: color.trim() || "#22c55e",
      })
      setName("")
      setSlug("")
      setColor("#22c55e")
      await loadTags()
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建标签失败"
      setError(message)
    }
  }

  const handleDelete = async (tagId: number) => {
    setError("")
    try {
      await deleteTag(tagId)
      await loadTags()
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除标签失败"
      setError(message)
    }
  }

  const startEdit = (tag: TagItem) => {
    setEditingTagId(tag.id)
    setEditingName(tag.name)
    setEditingSlug(tag.slug)
    setEditingColor(tag.color)
    setError("")
  }

  const cancelEdit = () => {
    setEditingTagId(null)
    setEditingName("")
    setEditingSlug("")
    setEditingColor("#22c55e")
  }

  const handleUpdate = async () => {
    if (editingTagId === null) return

    const nextName = editingName.trim()
    const nextSlug = slugify(editingSlug || editingName)
    if (!nextName || !nextSlug) {
      setError("标签名称和 slug 不能为空")
      return
    }

    setError("")
    try {
      await updateTag(editingTagId, {
        name: nextName,
        slug: nextSlug,
        color: editingColor.trim() || "#22c55e",
      })
      cancelEdit()
      await loadTags()
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新标签失败"
      setError(message)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">标签管理</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-medium">新建标签</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="标签名称，如 LangChain"
              value={name}
              onChange={(e) => {
                const value = e.target.value
                setName(value)
                if (!slug) setSlug(slugify(value))
              }}
            />
            <Input
              placeholder="slug，如 langchain"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Input
              placeholder="#22c55e"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" />新建标签</Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loadingText ? <p className="text-sm text-muted-foreground">{loadingText}</p> : null}
          <div className="space-y-3">
            {tags.map((tag) => {
              const editing = editingTagId === tag.id
              return (
                <div key={tag.id} className="py-2 border-b border-border last:border-0">
                  {!editing ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="font-medium">{tag.name}</span>
                        <span className="text-xs text-muted-foreground">/{tag.slug}</span>
                        <span className="text-xs text-muted-foreground">{tag.color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tag)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(tag.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        <Input value={editingSlug} onChange={(e) => setEditingSlug(e.target.value)} />
                        <Input value={editingColor} onChange={(e) => setEditingColor(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleUpdate}><Save className="h-3.5 w-3.5 mr-1" />保存</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>取消</Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
