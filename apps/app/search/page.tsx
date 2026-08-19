import Link from "next/link"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { getServerApiBase } from "@/lib/api-base"

interface SearchArticle {
  id: number
  title: string
  slug: string
  summary: string
  published_at: string
  read_time: number
}

interface SearchProject {
  id: number
  title: string
  slug: string
  summary: string
  tech_stack: string[]
}

interface SearchData {
  query: string
  scope: "all" | "articles" | "projects"
  total: number
  page: number
  total_pages: number
  articles: SearchArticle[]
  projects: SearchProject[]
}

async function searchData(query: string, scope: string, page: number): Promise<SearchData> {
  const params = new URLSearchParams({ q: query, scope, page: String(page), page_size: "12" })
  const res = await fetch(`${getServerApiBase()}/search?${params.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed to search")
  const json = await res.json()
  return json.data as SearchData
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string; page?: string }>
}) {
  const params = await searchParams
  const q = (params.q || "").trim()
  const scope = params.scope === "articles" || params.scope === "projects" ? params.scope : "all"
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1)

  const data = q ? await searchData(q, scope, page) : { query: "", scope: "all" as const, total: 0, page: 1, total_pages: 0, articles: [], projects: [] }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">搜索</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {q ? `关键词: ${q}，共 ${data.total} 条结果` : "输入关键词搜索文章与项目"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/search?q=${encodeURIComponent(q)}&scope=all&page=1`}><Button variant={scope === "all" ? "default" : "outline"} size="sm">全部</Button></Link>
            <Link href={`/search?q=${encodeURIComponent(q)}&scope=articles&page=1`}><Button variant={scope === "articles" ? "default" : "outline"} size="sm">文章</Button></Link>
            <Link href={`/search?q=${encodeURIComponent(q)}&scope=projects&page=1`}><Button variant={scope === "projects" ? "default" : "outline"} size="sm">项目</Button></Link>
          </div>
        </div>

        {!q ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">请在顶部搜索框输入关键词。</CardContent>
          </Card>
        ) : null}

        {q && (scope === "all" || scope === "articles") ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">文章结果</h2>
            {data.articles.length === 0 ? (
              <Card><CardContent className="p-4 text-sm text-muted-foreground">未找到匹配文章</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {data.articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{article.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.summary}</p>
                        <p className="text-xs text-muted-foreground">{article.published_at} · {article.read_time} 分钟</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {q && (scope === "all" || scope === "projects") ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">项目结果</h2>
            {data.projects.length === 0 ? (
              <Card><CardContent className="p-4 text-sm text-muted-foreground">未找到匹配项目</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.summary}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {project.tech_stack.slice(0, 4).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {q ? (
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            createHref={(nextPage) => `/search?${new URLSearchParams({ q, scope, page: String(nextPage) }).toString()}`}
          />
        ) : null}
      </main>
      <Footer />
    </>
  )
}
