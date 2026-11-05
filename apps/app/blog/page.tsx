import type { Metadata } from "next"
import Link from "next/link"

import { BlogSearchInput } from "@/components/blog/blog-search-input"
import { LeadPost, PostCard } from "@/components/blog/post-card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Pagination } from "@/components/ui/pagination"
import { getAllArticles, getTags } from "@/lib/content"

const PAGE_SIZE = 10

export const metadata: Metadata = { title: "博客" }

function blogHref({ tag, q, page }: { tag?: string; q?: string; page?: number }): string {
  const params = new URLSearchParams()
  if (tag) params.set("tag", tag)
  if (q) params.set("q", q)
  if (page && page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/blog?${search}` : "/blog"
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>
}) {
  const params = await searchParams
  const tag = (params.tag || "").trim()
  const q = (params.q || "").trim()
  const keyword = q.toLowerCase()
  const filtering = Boolean(tag || q)

  const [articles, tags] = await Promise.all([getAllArticles(), getTags()])
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
      <main className="flex-1">
        <div className="page wrap">
          <header className="head">
            <h1 className="serif">博客</h1>
            <p>AI Agent 学习笔记与技术分享</p>
          </header>

          <div className="controls">
            <div className="tags" role="group" aria-label="按标签筛选">
              <Link className="tag" href={blogHref({ q })} aria-current={tag ? undefined : "true"} scroll={false}>
                全部<small>{articles.length}</small>
              </Link>
              {visibleTags.map((item) => (
                <Link
                  key={item.slug}
                  className="tag"
                  href={blogHref({ tag: item.slug, q })}
                  aria-current={item.slug === tag ? "true" : undefined}
                  scroll={false}
                >
                  {item.name}<small>{countByTag.get(item.slug) ?? 0}</small>
                </Link>
              ))}
            </div>
            <BlogSearchInput query={q} tag={tag} />
          </div>

          <p className="status" aria-live="polite">
            {filtering ? (
              <>找到 {found.length} 篇 <Link className="link-btn" href="/blog" scroll={false}>清除筛选</Link></>
            ) : (
              `共 ${articles.length} 篇，按发布时间排序`
            )}
          </p>

          {found.length === 0 ? (
            <div className="empty">
              <h2 className="serif">{filtering ? "没有符合条件的文章" : "还没有文章"}</h2>
              <p>{filtering ? "换个关键词，或者清除筛选看全部文章。" : "第一篇正在写，敬请期待。"}</p>
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
            <Pagination page={page} totalPages={totalPages} createHref={(nextPage) => blogHref({ tag, q, page: nextPage })} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
