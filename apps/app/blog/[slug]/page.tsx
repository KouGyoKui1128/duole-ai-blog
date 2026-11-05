import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MarkdownContent } from "@/components/blog/markdown-content"
import { fetchPublic } from "@/lib/public-api"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, ArrowLeft } from "lucide-react"

interface Props { params: Promise<{ slug: string }> }

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

async function getArticle(slug: string): Promise<BlogArticle | null> {
  const res = await fetchPublic(`/articles/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error("failed to fetch article")
  const json = await res.json()
  return (json.data as BlogArticle | null) ?? null
}

async function getRelatedArticles(slug: string): Promise<BlogArticle[]> {
  const res = await fetchPublic(`/articles/${encodeURIComponent(slug)}/related?limit=2`)
  if (!res.ok) throw new Error("failed to fetch related articles")
  const json = await res.json()
  return Array.isArray(json.data) ? json.data as BlogArticle[] : []
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const [article, relatedArticles] = await Promise.all([getArticle(slug), getRelatedArticles(slug)])
  if (!article) notFound()

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回博客列表
        </Link>

        <article>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{article.published_at}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{article.read_time} 分钟阅读</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{article.title}</h1>
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Badge key={tag.slug} variant="secondary">{tag.name}</Badge>
            ))}
          </div>
          <Separator className="mb-8" />
          <MarkdownContent content={article.content} />
        </article>

        {relatedArticles.length > 0 ? (
          <>
            <Separator className="my-10" />
            <div className="flex flex-col sm:flex-row gap-4">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={"/blog/" + related.slug} className="flex-1">
                  <div className="rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
                    <p className="text-xs text-muted-foreground mb-1">相关文章</p>
                    <p className="font-medium text-sm line-clamp-2">{related.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
