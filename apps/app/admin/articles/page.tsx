'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { deleteArticle, getArticles, setArticlePublished, type ArticleItem } from "@/lib/admin-api"

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchArticles = (nextPage = page) =>
    getArticles(nextPage, 10)
      .then((data) => {
        setArticles(data.items)
        setPage(data.page)
        setTotalPages(data.total_pages)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "加载文章失败"
        setError(message)
      })
      .finally(() => {
        setLoading(false)
      })

  const loadArticles = async (nextPage = page) => {
    setLoading(true)
    setError("")
    await fetchArticles(nextPage)
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteArticle(id)
      await loadArticles(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除失败，可能没有权限"
      setError(message)
    }
  }

  const handleTogglePublished = async (article: ArticleItem) => {
    try {
      await setArticlePublished(article.id, !article.is_public)
      await loadArticles(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新发布状态失败"
      setError(message)
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
                  <span>·</span>
                  <Badge variant={article.is_public ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                    {article.is_public ? "已发布" : "草稿"}
                  </Badge>
                  <div className="flex gap-1 ml-1">
                    {article.tags.map((t) => (
                      <Badge key={t.slug} variant="secondary" className="text-[10px] px-1.5 py-0">{t.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 shrink-0">
                {article.is_public ? (
                  <Link href={`/blog/${article.slug}`} target="_blank">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                  </Link>
                ) : null}
                <Link href={`/admin/articles/${article.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                </Link>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleTogglePublished(article)}>
                  {article.is_public ? "转为草稿" : "发布"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(article.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        createHref={(nextPage) => `/admin/articles?page=${nextPage}`}
      />
    </div>
  )
}
