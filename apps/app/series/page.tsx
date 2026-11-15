import type { Metadata } from "next"
import Link from "next/link"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import { getSeriesList, type SeriesSummary } from "@/lib/content"

export const metadata: Metadata = { title: "合集", description: "按顺序读的文章合集" }

const LANGUAGES: ArticleLanguage[] = ["zh", "en"]

function SeriesRows({ series, language }: { series: SeriesSummary[]; language: ArticleLanguage }) {
  const copy = SECTION_COPY[language].series
  return (
    <section className="sec-results" lang={language === "en" ? "en" : undefined} aria-labelledby={`series-${language}`}>
      <div className="sec-head">
        <h2 className="serif" id={`series-${language}`}>{copy.heading}</h2>
      </div>
      <div className="rows">
        {series.map((item) => (
          <Link key={item.id} className="prow" href={`/series/${item.slug}`}>
            <span className="label">{copy.count(item.article_count)}</span>
            <span>
              <span className="t">{item.title}</span>
              {item.summary ? <span className="srow-sum">{item.summary}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default async function SeriesIndexPage() {
  const series = await getSeriesList()
  const groups = LANGUAGES.map((language) => ({ language, items: series.filter((item) => item.language === language) }))

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page wrap list-end">
          <header className="head">
            <h1 className="serif">合集</h1>
            <p>按顺序读的文章，中文和英文各自成集</p>
          </header>

          {series.length === 0 ? (
            <div className="empty">
              <h2 className="serif">还没有合集</h2>
              <p>先去<Link className="link-btn" href="/blog">博客</Link>看看单篇文章。</p>
            </div>
          ) : (
            groups
              .filter((group) => group.items.length > 0)
              .map((group) => <SeriesRows key={group.language} series={group.items} language={group.language} />)
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
