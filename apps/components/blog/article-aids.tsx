'use client'

import { useEffect, useRef, useState } from "react"

import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import type { Heading } from "@/lib/markdown"

const ACTIVE_HEADING_OFFSET = 140

export function ArticleAids({ headings, language }: { headings: Heading[]; language: ArticleLanguage }) {
  const barRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState(headings[0]?.id)
  const copy = SECTION_COPY[language]

  useEffect(() => {
    const article = document.getElementById("prose")
    if (!article) return

    const elements = headings.flatMap((heading) => document.getElementById(heading.id) ?? [])
    let frame = 0

    const update = () => {
      frame = 0
      let current = elements[0]
      for (const element of elements) {
        if (element.getBoundingClientRect().top < ACTIVE_HEADING_OFFSET) current = element
      }
      setActiveId(current?.id)

      const box = article.getBoundingClientRect()
      const done = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - box.top) / box.height))
      if (barRef.current) barRef.current.style.transform = `scaleX(${done})`
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [headings])

  return (
    <>
      <div ref={barRef} className="read-bar" aria-hidden="true" />
      {headings.length > 0 ? (
        <nav className="toc" aria-label={copy.contentsLabel}>
          <h2>{copy.contents}</h2>
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={heading.level === 3 ? "sub" : undefined}
              aria-current={heading.id === activeId ? "true" : undefined}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      ) : null}
    </>
  )
}
