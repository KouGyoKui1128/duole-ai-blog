'use client'

import Link from "next/link"
import { useRef } from "react"

import { paintCover, type CoverKind } from "@/lib/cover-art"

export interface ArticleRow {
  slug: string
  title: string
  publishedAt: string
  readTime: number
  coverKind: CoverKind
}

const PEEK_WIDTH = 320
const PEEK_HEIGHT = 210

function canPeek(event: React.PointerEvent) {
  return event.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ArticleRows({ rows }: { rows: ArticleRow[] }) {
  const peekRef = useRef<HTMLCanvasElement>(null)

  const showPeek = (event: React.PointerEvent, row: ArticleRow) => {
    const peek = peekRef.current
    if (!peek || !canPeek(event)) return
    paintCover(peek, row.coverKind, row.slug)
    peek.classList.add("on")
  }

  const movePeek = (event: React.PointerEvent) => {
    const peek = peekRef.current
    if (!peek || !peek.classList.contains("on")) return
    const x = Math.min(event.clientX + 24, window.innerWidth - PEEK_WIDTH)
    const y = Math.max(16, Math.min(event.clientY - 95, window.innerHeight - PEEK_HEIGHT))
    peek.style.transform = `translate(${x}px,${y}px)`
  }

  const hidePeek = () => peekRef.current?.classList.remove("on")

  return (
    <>
      <div className="rows" onPointerMove={movePeek} onPointerLeave={hidePeek}>
        {rows.map((row) => (
          <Link key={row.slug} className="prow" href={`/blog/${row.slug}`} onPointerEnter={(event) => showPeek(event, row)}>
            <span className="label">{row.publishedAt}</span>
            <span className="t">{row.title}</span>
            <span className="label tagtxt">{row.readTime} 分钟</span>
          </Link>
        ))}
      </div>
      <canvas ref={peekRef} className="peek" aria-hidden="true" />
    </>
  )
}
