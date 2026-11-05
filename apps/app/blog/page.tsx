import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { fetchPublic } from "@/lib/public-api"
import Link from "next/link"
import { Calendar, Clock } from "lucide-react"

interface BlogTag {
  name: string
  slug: string
  color: string
}

interface BlogArticle {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  published_at: string
  read_time: number
  tags: BlogTag[]
}

async function getBlogData(page: number, tag: string | undefined) {
  const query = new URLSearchParams({ page: String(page), page_size: "10", ...(tag ? { tag } : {}) })
  const res = await fetchPublic(`/articles?${query.toString()}`)
  if (!res.ok) throw new Error("failed to fetch articles")
  const json = await res.json()
  return {
    items: Array.isArray(json.data?.items) ? json.data.items as BlogArticle[] : [],
    page: Number(json.data?.page) || page,
    totalPages: Number(json.data?.total_pages) || 0,
  }
}

async function getTagsData(): Promise<BlogTag[]> {
  const res = await fetchPublic("/tags")
  if (!res.ok) throw new Error("failed to fetch tags")
  const json = await res.json()
  return json.data
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1)
  const articlesData = await getBlogData(page, params.tag)
  const articles = articlesData.items
  const tags = await getTagsData()

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">博客</h1>
        <p className="text-muted-foreground mb-8">AI Agent 学习笔记与技术分享</p>

        {/* Tags filter */}
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
          <Link href="/blog">
            <Badge variant={params.tag ? "outline" : "default"} className="cursor-pointer hover:opacity-80">全部</Badge>
          </Link>
          {tags.map((tag) => (
            <Link key={tag.slug} href={`/blog?tag=${encodeURIComponent(tag.slug)}&page=1`}>
              <Badge variant={params.tag === tag.slug ? "default" : "secondary"} className="cursor-pointer hover:opacity-80">{tag.name}</Badge>
            </Link>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">第 {articlesData.page} 页</p>

        {articles.length === 0 ? <p className="text-sm text-muted-foreground">{params.tag ? "这个标签下还没有文章。" : "还没有文章，敬请期待。"}</p> : null}

        {/* Articles */}
        <div className="space-y-6">
          {articles.map((article) => (
            <Link key={article.id} href={"/blog/" + article.slug}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{article.published_at}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.read_time} 分钟</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">{article.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <Badge key={tag.slug} variant="secondary" className="text-xs">{tag.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Pagination
          page={articlesData.page}
          totalPages={articlesData.totalPages}
          createHref={(nextPage) => `/blog?${new URLSearchParams({ ...(params.tag ? { tag: params.tag } : {}), page: String(nextPage) }).toString()}`}
        />
      </main>
      <Footer />
    </>
  )
}
