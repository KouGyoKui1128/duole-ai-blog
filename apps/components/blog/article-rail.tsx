'use client'

import Link from "next/link"

import { useReadingProgress } from "@/components/blog/reading-progress"
import { showToast } from "@/components/site/toast"
import { ARTICLE_TOP_ID, SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import type { ArticleSeries } from "@/lib/content"
import type { Heading } from "@/lib/markdown"

interface RailSectionsProps {
  headings: Heading[]
  series: ArticleSeries | null
  language: ArticleLanguage
  readMinutes: number
  /** The phone sheet shows progress; on wide screens the reading panel does. */
  withProgress?: boolean
  /** Set by the phone sheet: it closes first, then scrolls to the element with this id. */
  onNavigate?: (targetId: string) => void
}

/** h2s are numbered 01, 02, … to match the numbers in front of the headings in the text. */
function numberHeadings(headings: Heading[]) {
  let count = 0
  return headings.map((heading) => ({
    ...heading,
    number: heading.level === 2 ? String(++count).padStart(2, "0") : null,
  }))
}

async function copyArticleLink(language: ArticleLanguage) {
  const copy = SECTION_COPY[language]
  try {
    await navigator.clipboard.writeText(window.location.href.split("#")[0])
    showToast(copy.reader.linkCopied)
  } catch {
    showToast(copy.copyFailed)
  }
}

export function RailSections({ headings, series, language, readMinutes, withProgress = false, onNavigate }: RailSectionsProps) {
  const { percent, activeId } = useReadingProgress()
  const copy = SECTION_COPY[language]

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onNavigate) return
    event.preventDefault()
    onNavigate(id)
  }

  const backToTop = () => {
    if (onNavigate) onNavigate(ARTICLE_TOP_ID)
    else document.getElementById(ARTICLE_TOP_ID)?.scrollIntoView({ block: "start" })
  }

  return (
    <>
      {withProgress ? (
        <section>
          <h2 className="rail-h">{copy.reader.progress}</h2>
          <div className="meter">
            <span>{copy.reader.aboutMinutes(readMinutes)}</span>
            <b>{percent}%</b>
          </div>
          <div className="track"><i style={{ width: `${percent}%` }} /></div>
        </section>
      ) : null}

      {headings.length > 0 ? (
        <section>
          <h2 className="rail-h">{copy.contents}</h2>
          <nav className="rail-toc" aria-label={copy.contentsLabel}>
            {numberHeadings(headings).map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={heading.level === 3 ? "sub" : undefined}
                aria-current={heading.id === activeId ? "true" : undefined}
                onClick={(event) => jump(event, heading.id)}
              >
                {heading.number ? <span>{heading.number}</span> : null}
                {heading.text}
              </a>
            ))}
          </nav>
        </section>
      ) : null}

      {series ? (
        <section className="series-box">
          <h2 className="rail-h">{copy.reader.seriesBox}</h2>
          <Link href={`/series/${series.slug}`}>{series.title}</Link>
          <span className="label">{copy.reader.seriesPart(series.position, series.total)}</span>
        </section>
      ) : null}

      <section className="actions">
        <h2 className="rail-h">{copy.reader.actions}</h2>
        <button type="button" onClick={() => copyArticleLink(language)}>{copy.reader.copyLink}</button>
        <button type="button" onClick={backToTop}>{copy.reader.backToTop}</button>
      </section>
    </>
  )
}

/** The sticky right-hand column on wide screens. */
export function ArticleRail(props: Omit<RailSectionsProps, "withProgress" | "onNavigate">) {
  return (
    <aside className="art-rail" aria-label={SECTION_COPY[props.language].reader.railLabel}>
      <RailSections {...props} />
    </aside>
  )
}
