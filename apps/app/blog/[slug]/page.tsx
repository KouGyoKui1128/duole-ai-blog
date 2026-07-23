import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { articles } from "@/lib/mock-data"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, ArrowLeft } from "lucide-react"

interface Props { params: Promise<{ slug: string }> }

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
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
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{article.publishedAt}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{article.readTime} 分钟阅读</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{article.title}</h1>
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Badge key={tag.slug} variant="secondary">{tag.name}</Badge>
            ))}
          </div>
          <Separator className="mb-8" />
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border">
            {article.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-medium mt-5 mb-2">{line.slice(4)}</h3>
              if (line.startsWith('```')) return null  // skip fence markers
              if (line.startsWith('---')) return <Separator key={i} className="my-6" />
              if (line.match(/^\|/)) {
                const cells = line.split('|').filter(Boolean).map(c => c.trim())
                if (line.match(/^\|[\s:-]+\|/)) return null  // skip table header separator
                return <div key={i} className="grid grid-cols-3 gap-4 py-1 text-sm">{cells.map((c, j) => <span key={j}>{c}</span>)}</div>
              }
              if (line.startsWith('- ')) return <li key={i} className="ml-4 text-foreground">{line.slice(2)}</li>
              if (line.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal text-foreground">{line.slice(3)}</li>
              if (line.startsWith('```python') || line.startsWith('```typescript')) return null
              if (line.startsWith('```')) return null
              return <p key={i} className="text-foreground leading-relaxed mb-4">{line}</p>
            })}
          </div>
        </article>

        <Separator className="my-10" />
        <div className="flex flex-col sm:flex-row gap-4">
          {articles.filter(a => a.id !== article.id).slice(0, 2).map((related) => (
            <Link key={related.id} href={"/blog/" + related.slug} className="flex-1">
              <div className="rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
                <p className="text-xs text-muted-foreground mb-1">相关文章</p>
                <p className="font-medium text-sm line-clamp-2">{related.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
