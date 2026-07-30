'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deleteArticle, getArticles, type ArticleItem } from "@/lib/admin-api"

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadArticles = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getArticles()
      setArticles(data)
    } catch {
      setError("加载文章失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteArticle(id)
      await loadArticles()
    } catch {
      setError("删除失败，可能没有权限")
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new">
          <Button><Plus className="h-4 w-4 mr-1" />新建文章</Button>
        </Link>
      </div>

      {loading ? <p className="text-sm text-muted-foreground mb-4">正在加载文章...</p> : null}
      {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}

      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{article.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{article.published_at}</span>
                  <span>·</span>
                  <span>{article.read_time} 分钟</span>
                  <div className="flex gap-1 ml-1">
                    {article.tags.map((t) => (
                      <Badge key={t.slug} variant="secondary" className="text-[10px] px-1.5 py-0">{t.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 shrink-0">
                <Link href={`/blog/${article.slug}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                </Link>
                <Link href={`/admin/articles/${article.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(article.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
