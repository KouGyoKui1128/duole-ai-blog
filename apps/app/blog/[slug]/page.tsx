import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArticleAids } from "@/components/blog/article-aids"
import { Cover } from "@/components/blog/cover"
import { MarkdownContent } from "@/components/blog/markdown-content"
import { articleMeta, PostCard } from "@/components/blog/post-card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { getArticle, getRelatedArticles, getResume } from "@/lib/content"
import { articleCoverKind } from "@/lib/cover-art"
import { extractHeadings } from "@/lib/markdown"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  return article ? { title: article.title, description: article.summary } : {}
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const [article, relatedArticles, resume] = await Promise.all([getArticle(slug), getRelatedArticles(slug), getResume()])
  if (!article) notFound()

  const headings = extractHeadings(article.content)
  const tagNames = article.tags.map((tag) => tag.name).join(" / ")

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page">
          <div className="wrap">
            <header className="ahead">
              <Link className="more" href="/blog">返回博客</Link>
              <h1 className="serif">{article.title}</h1>
              <p className="sum">{article.summary}</p>
              <p className="label">{articleMeta(article)}{tagNames ? ` · ${tagNames}` : ""}</p>
            </header>
          </div>

          <div className="wrap">
            <div className="acover">
              <Cover kind={articleCoverKind(article.tags)} seed={article.slug} label={article.title} />
            </div>
          </div>

          <div className={headings.length > 0 ? "wrap alayout" : "wrap alayout solo"}>
            <ArticleAids headings={headings} />
            <div className="min-w-0">
              <MarkdownContent content={article.content} />
              <aside className="by" aria-label="作者">
                <div>
                  <b>{resume?.name || "DuoLe"}</b>
                  {resume?.title ? <span>{resume.title}</span> : null}
                </div>
                <nav aria-label="了解作者">
                  <Link className="more" href="/projects">看项目</Link>
                  <Link className="more" href="/resume">读简历</Link>
                </nav>
              </aside>
            </div>
          </div>

          {relatedArticles.length > 0 ? (
            <section className="next">
              <div className="wrap">
                <div className="sec-head">
                  <h2 className="serif">相关文章</h2>
                </div>
                <div className="grid">
                  {relatedArticles.map((related) => (
                    <PostCard key={related.id} article={related} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}
