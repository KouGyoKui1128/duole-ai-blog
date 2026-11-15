import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { articlePath, SECTION_COPY } from "@/lib/article-language"
import { getSeries } from "@/lib/content"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const series = await getSeries(slug)
  return series ? { title: series.title, description: series.summary || undefined } : {}
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params
  const series = await getSeries(slug)
  if (!series) notFound()

  const copy = SECTION_COPY[series.language]

  return (
    <>
      <Header />
      <main className="flex-1" lang={series.language === "en" ? "en" : undefined}>
        <div className="page wrap list-end">
          <header className="ahead">
            <Link className="more" href="/series">{copy.series.backToAll}</Link>
            <h1 className="serif">{series.title}</h1>
            {series.summary ? <p className="sum">{series.summary}</p> : null}
            <p className="label">{copy.series.count(series.articles.length)}</p>
          </header>

          <ol className="rows">
            {series.articles.map((article, index) => (
              <li key={article.id}>
                <Link className="prow" href={articlePath(article)}>
                  <span className="label">{copy.series.part(index + 1)}</span>
                  <span>
                    <span className="t">{article.title}</span>
                    {article.summary ? <span className="srow-sum">{article.summary}</span> : null}
                  </span>
                  <span className="label tagtxt">{copy.readTime(article.read_time)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </>
  )
}
