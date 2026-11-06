import Link from "next/link"

import { BlogSearchInput } from "@/components/blog/blog-search-input"
import { LeadPost, PostCard } from "@/components/blog/post-card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Pagination } from "@/components/ui/pagination"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import { getAllArticles, getTags } from "@/lib/content"

const PAGE_SIZE = 10

export interface ArticleIndexParams {
  page?: string
  tag?: string
  q?: string
}

function indexHref(path: string, { tag, q, page }: { tag?: string; q?: string; page?: number }): string {
  const params = new URLSearchParams()
  if (tag) params.set("tag", tag)
  if (q) params.set("q", q)
  if (page && page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

export async function ArticleIndex({ language, params }: { language: ArticleLanguage; params: ArticleIndexParams }) {
  const copy = SECTION_COPY[language]
  const tag = (params.tag || "").trim()
  const q = (params.q || "").trim()
  const keyword = q.toLowerCase()
  const filtering = Boolean(tag || q)

  const [articles, tags] = await Promise.all([getAllArticles(language), getTags()])
  const found = articles.filter(
    (article) =>
      (!tag || article.tags.some((item) => item.slug === tag)) &&
      (!keyword || `${article.title}${article.summary}`.toLowerCase().includes(keyword))
  )

  const totalPages = Math.ceil(found.length / PAGE_SIZE)
  const page = Math.min(Math.max(1, Number.parseInt(params.page || "1", 10) || 1), Math.max(totalPages, 1))
  const pageArticles = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const showLead = !filtering && page === 1
  const [lead, ...others] = pageArticles
  const gridArticles = showLead ? others : pageArticles

  const countByTag = new Map<string, number>()
  for (const article of articles) {
    for (const item of article.tags) countByTag.set(item.slug, (countByTag.get(item.slug) ?? 0) + 1)
  }
  const visibleTags = tags.filter((item) => countByTag.has(item.slug) || item.slug === tag)

  return (
    <>
      <Header />
      <main className="flex-1" lang={language === "en" ? "en" : undefined}>
        <div className="page wrap">
          <header className="head">
            <h1 className="serif">{copy.title}</h1>
            <p>{copy.intro}</p>
          </header>

          <div className="controls">
            <div className="tags" role="group" aria-label={copy.filterByTag}>
              <Link className="tag" href={indexHref(copy.path, { q })} aria-current={tag ? undefined : "true"} scroll={false}>
                {copy.all}<small>{articles.length}</small>
              </Link>
              {visibleTags.map((item) => (
                <Link
                  key={item.slug}
                  className="tag"
                  href={indexHref(copy.path, { tag: item.slug, q })}
                  aria-current={item.slug === tag ? "true" : undefined}
                  scroll={false}
                >
                  {item.name}<small>{countByTag.get(item.slug) ?? 0}</small>
                </Link>
              ))}
            </div>
            <BlogSearchInput query={q} tag={tag} language={language} />
          </div>

          <p className="status" aria-live="polite">
            {filtering ? (
              <>{copy.found(found.length)} <Link className="link-btn" href={copy.path} scroll={false}>{copy.clearFilters}</Link></>
            ) : (
              copy.total(articles.length)
            )}
          </p>

          {found.length === 0 ? (
            <div className="empty">
              <h2 className="serif">{filtering ? copy.noMatchTitle : copy.noArticlesTitle}</h2>
              <p>{filtering ? copy.noMatchHint : copy.noArticlesHint}</p>
            </div>
          ) : null}

          {showLead && lead ? <LeadPost article={lead} /> : null}
          {gridArticles.length > 0 ? (
            <div className={filtering ? "posts filtered" : "posts"}>
              {gridArticles.map((article) => (
                <PostCard key={article.id} article={article} />
              ))}
            </div>
          ) : null}

          <div className="list-end">
            <Pagination
              page={page}
              totalPages={totalPages}
              createHref={(nextPage) => indexHref(copy.path, { tag, q, page: nextPage })}
              labels={copy.pagination}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
