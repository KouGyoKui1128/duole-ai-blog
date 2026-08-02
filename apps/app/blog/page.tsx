import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getServerApiBase } from "@/lib/api-base"
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

async function getBlogData(): Promise<BlogArticle[]> {
  const res = await fetch(`${getServerApiBase()}/articles`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed to fetch articles")
  const json = await res.json()
  return json.data
}

async function getTagsData(): Promise<BlogTag[]> {
  const res = await fetch(`${getServerApiBase()}/tags`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed to fetch tags")
  const json = await res.json()
  return json.data
}

export default async function BlogPage() {
  const articles = await getBlogData()
  const tags = await getTagsData()

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">博客</h1>
        <p className="text-muted-foreground mb-8">AI Agent 学习笔记与技术分享</p>

        {/* Tags filter */}
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
          {tags.map((tag) => (
            <Link key={tag.slug} href={"/blog?tag=" + tag.slug}>
              <Badge variant="secondary" className="cursor-pointer hover:opacity-80">{tag.name}</Badge>
            </Link>
          ))}
        </div>

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
      </main>
      <Footer />
    </>
  )
}
