import type { Metadata } from "next"
import Link from "next/link"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Pagination } from "@/components/ui/pagination"
import { getServerApiBase } from "@/lib/api-base"

export const metadata: Metadata = { title: "搜索" }

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
  total: number
  page: number
  total_pages: number
  articles: SearchArticle[]
  projects: SearchProject[]
}

const NO_RESULTS: SearchData = { total: 0, page: 1, total_pages: 0, articles: [], projects: [] }
const SCOPES = [
  { value: "all", label: "全部" },
  { value: "articles", label: "文章" },
  { value: "projects", label: "项目" },
]

async function searchData(query: string, scope: string, page: number): Promise<SearchData> {
  const params = new URLSearchParams({ q: query, scope, page: String(page), page_size: "12" })
  const res = await fetch(`${getServerApiBase()}/search?${params.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed to search")
  const json = await res.json()
  return json.data as SearchData
}

function searchHref(q: string, scope: string, page = 1): string {
  return `/search?${new URLSearchParams({ q, scope, page: String(page) }).toString()}`
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
  const data = q ? await searchData(q, scope, page) : NO_RESULTS

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page wrap">
          <header className="head">
            <h1 className="serif">搜索</h1>
            <p>{q ? `“${q}”共 ${data.total} 条结果` : "输入关键词搜索文章与项目"}</p>
          </header>

          <div className="controls">
            <div className="tags" role="group" aria-label="搜索范围">
              {SCOPES.map((item) => (
                <Link key={item.value} className="tag" href={searchHref(q, item.value)} aria-current={scope === item.value ? "true" : undefined}>
                  {item.label}
                </Link>
              ))}
            </div>
            <form className="find" action="/search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.6-3.6" />
              </svg>
              <input type="search" name="q" defaultValue={q} placeholder="搜索文章和项目" aria-label="搜索文章和项目" />
              <input type="hidden" name="scope" value={scope} />
            </form>
          </div>

          {q && data.total === 0 ? (
            <div className="empty">
              <h2 className="serif">没有找到相关内容</h2>
              <p>换个关键词试试，比如 LangGraph、RAG 或 Agent。</p>
            </div>
          ) : null}

          {data.articles.length > 0 ? (
            <section className="sec-results">
              <h2 className="label">文章</h2>
              <div className="rows">
                {data.articles.map((article) => (
                  <Link key={article.id} className="prow" href={`/blog/${article.slug}`}>
                    <span className="label">{article.published_at}</span>
                    <span className="t">{article.title}</span>
                    <span className="label tagtxt">{article.read_time} 分钟</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {data.projects.length > 0 ? (
            <section className="sec-results">
              <h2 className="label">项目</h2>
              <div className="rows">
                {data.projects.map((project) => (
                  <Link key={project.id} className="prow" href={`/projects/${project.slug}`}>
                    <span className="label">项目</span>
                    <span className="t">{project.title}</span>
                    <span className="label tagtxt">{project.tech_stack.slice(0, 2).join(" · ")}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="list-end">
            {q ? <Pagination page={data.page} totalPages={data.total_pages} createHref={(nextPage) => searchHref(q, scope, nextPage)} /> : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
