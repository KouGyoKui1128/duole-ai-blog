import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArticleAids } from "@/components/blog/article-aids"
import { Cover } from "@/components/blog/cover"
import { MarkdownContent } from "@/components/blog/markdown-content"
import { articleMeta, PostCard } from "@/components/blog/post-card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import { getArticle, getRelatedArticles, getResume } from "@/lib/content"
import { articleCoverKind } from "@/lib/cover-art"
import { extractHeadings } from "@/lib/markdown"

interface ArticleDetailProps {
  slug: string
  language: ArticleLanguage
}

export async function articleMetadata({ slug, language }: ArticleDetailProps): Promise<Metadata> {
  const article = await getArticle(slug)
  return article?.language === language ? { title: article.title, description: article.summary } : {}
}

export async function ArticleDetail({ slug, language }: ArticleDetailProps) {
  const [article, relatedArticles, resume] = await Promise.all([getArticle(slug), getRelatedArticles(slug), getResume()])
  if (article?.language !== language) notFound()

  const copy = SECTION_COPY[language]
  const headings = extractHeadings(article.content)
  const tagNames = article.tags.map((tag) => tag.name).join(" / ")
  // The resume title is written in Chinese, so English pages show the name alone.
  const authorTitle = language === "zh" ? resume?.title : null

  return (
    <>
      <Header />
      <main className="flex-1" lang={language === "en" ? "en" : undefined}>
        <div className="page">
          <div className="wrap">
            <header className="ahead">
              <Link className="more" href={copy.path}>{copy.backToList}</Link>
              <h1 className="serif">{article.title}</h1>
              <p className="sum">{article.summary}</p>
              <p className="label">{articleMeta(article)}{tagNames ? ` · ${tagNames}` : ""}</p>
            </header>
          </div>

          <div className="wrap">
            <div className="acover">
              <Cover kind={articleCoverKind(article.tags)} seed={article.slug} label={article.title} language={language} />
            </div>
          </div>

          <div className={headings.length > 0 ? "wrap alayout" : "wrap alayout solo"}>
            <ArticleAids headings={headings} language={language} />
            <div className="min-w-0">
              <MarkdownContent content={article.content} language={language} />
              <aside className="by" aria-label={copy.authorLabel}>
                <div>
                  <b>{resume?.name || "DuoLe"}</b>
                  {authorTitle ? <span>{authorTitle}</span> : null}
                </div>
                <nav aria-label={copy.aboutAuthor}>
                  <Link className="more" href="/projects">{copy.viewProjects}</Link>
                  <Link className="more" href="/resume">{copy.viewResume}</Link>
                </nav>
              </aside>
            </div>
          </div>

          {relatedArticles.length > 0 ? (
            <section className="next">
              <div className="wrap">
                <div className="sec-head">
                  <h2 className="serif">{copy.relatedArticles}</h2>
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
