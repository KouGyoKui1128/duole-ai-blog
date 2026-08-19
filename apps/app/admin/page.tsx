'use client'

import { useEffect, useMemo, useState } from "react"
import { FileText, FolderKanban, Eye } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getArticles, getProjects, type ArticleItem, type ProjectItem } from "@/lib/admin-api"

export default function AdminDashboard() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getArticles(), getProjects()])
      .then(([articleData, projectData]) => {
        setArticles(Array.isArray(articleData.items) ? articleData.items : [])
        setProjects(Array.isArray(projectData.items) ? projectData.items : [])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载统计失败")
        setArticles([])
        setProjects([])
      })
      .finally(() => setLoading(false))
  }, [])

  const totalReadTime = useMemo(() => articles.reduce((acc, item) => acc + item.read_time, 0), [articles])

  const stats = [
    { label: "文章", value: articles.length, icon: FileText, color: "text-blue-600" },
    { label: "项目", value: projects.length, icon: FolderKanban, color: "text-green-600" },
    { label: "累计阅读时长", value: `${totalReadTime} 分钟`, icon: Eye, color: "text-orange-600" },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      {loading ? <p className="text-sm text-muted-foreground mb-4">正在加载统计...</p> : null}
      {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">最新文章</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {articles.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{a.title}</span>
                  <span className="text-muted-foreground text-xs ml-2">{a.published_at}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">最新项目</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 3).map((p) => (
                <div key={p.id} className="text-sm">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
