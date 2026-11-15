import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArticleRail } from "@/components/blog/article-rail"
import { MarkdownContent } from "@/components/blog/markdown-content"
import { PostCard } from "@/components/blog/post-card"
import { ReaderSheet } from "@/components/blog/reader-sheet"
import { ReadingPanel } from "@/components/blog/reading-panel"
import { ReadBar, ReadingProgressProvider } from "@/components/blog/reading-progress"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ARTICLE_TOP_ID, articlePath, SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import { getArticle, getRelatedArticles, getResume } from "@/lib/content"
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
  const series = article.series ?? null
  const authorName = resume?.name?.trim() || "DuoLe"
  const initial = Array.from(authorName)[0].toUpperCase()
  // The resume title is written in Chinese, so English pages show the name alone.
  const authorTitle = language === "zh" ? resume?.title : null
  const rail = { headings, series, language, readMinutes: article.read_time }

  return (
    // Keyed by slug so moving to the next article in a series starts the reading state and panel afresh.
    <ReadingProgressProvider key={article.slug}>
      <Header>
        <ReadBar />
      </Header>
      <main className="flex-1" lang={language === "en" ? "en" : undefined}>
        <div className="page">
          <header className="art-head" id={ARTICLE_TOP_ID}>
            <nav className="crumb" aria-label={copy.reader.crumbLabel}>
              <Link href={copy.path}>{copy.title}</Link>
              {series ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={`/series/${series.slug}`}>{copy.reader.seriesCrumb(series.title)}</Link>
                </>
              ) : null}
            </nav>
            <h1>{article.title}</h1>
            {article.summary ? <p className="sum">{article.summary}</p> : null}
            <div className="byline">
              <span className="avatar" aria-hidden="true">{initial}</span>
              <span>
                <b>{authorName}</b> · {article.published_at} · {copy.reader.readingTime(article.read_time)}
              </span>
            </div>
            {article.tags.length > 0 ? (
              <p className="tagline label">
                <span className="sr-only">{copy.reader.tagsLabel}: </span>
                {article.tags.map((tag) => (
                  <Link key={tag.slug} href={`${copy.path}?tag=${encodeURIComponent(tag.slug)}`}>{tag.name}</Link>
                ))}
              </p>
            ) : null}
          </header>
          <hr className="art-rule" />

          <div className="art-body">
            <ReadingPanel language={language} readMinutes={article.read_time} />
            <div className="art-text">
              <MarkdownContent content={article.content} language={language} />
            </div>
            <ArticleRail {...rail} />

            <div className="art-end">
              {series ? (
                <nav className="snav" aria-label={copy.series.navLabel}>
                  {series.previous ? (
                    <Link href={articlePath({ slug: series.previous.slug, language })} rel="prev">
                      <span className="label">← {copy.series.previous}</span>
                      <span className="t">{series.previous.title}</span>
                    </Link>
                  ) : (
                    <div>
                      <span className="label">← {copy.series.previous}</span>
                      <span className="t off">{copy.reader.firstInSeries}</span>
                    </div>
                  )}
                  {series.next ? (
                    <Link href={articlePath({ slug: series.next.slug, language })} rel="next">
                      <span className="label">{copy.series.next} →</span>
                      <span className="t">{series.next.title}</span>
                    </Link>
                  ) : (
                    <div>
                      <span className="label">{copy.series.next} →</span>
                      <span className="t off">{copy.reader.nextComing}</span>
                    </div>
                  )}
                </nav>
              ) : null}
              <aside className="author-box" aria-label={copy.authorLabel}>
                <div className="who">
                  <span className="avatar" aria-hidden="true">{initial}</span>
                  <div>
                    <b>{authorName}</b>
                    {authorTitle ? <span>{authorTitle}</span> : null}
                  </div>
                </div>
                <nav aria-label={copy.aboutAuthor}>
                  <Link href="/projects">{copy.viewProjects}</Link>
                  <Link href="/resume">{copy.viewResume}</Link>
                </nav>
              </aside>
            </div>

            <ReaderSheet {...rail} />
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
    </ReadingProgressProvider>
  )
}
