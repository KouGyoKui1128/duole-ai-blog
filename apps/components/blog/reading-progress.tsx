'use client'

import { createContext, useContext, useEffect, useState } from "react"

/** Where the reader is in the article, shared by the read bar, contents, reading panel and phone sheet. */
export interface ReadingProgress {
  /** 0 to 100, measured at a line a little above the middle of the screen. */
  percent: number
  /** The h2 or h3 the reader is in, for highlighting the contents. */
  activeId: string | null
  /** Sections are the h2 headings; 0 when the article has none. */
  sectionCount: number
  /** Index of the current h2, or -1 before the first one. */
  sectionIndex: number
  sectionTitle: string
}

const INITIAL: ReadingProgress = { percent: 0, activeId: null, sectionCount: 0, sectionIndex: -1, sectionTitle: "" }
// The line the reader is looking at, as a fraction of the window height.
const READING_LINE = 0.55
// A heading counts as current once its top passes this far below the window top (below the sticky header).
const ACTIVE_HEADING_OFFSET = 140

const ReadingProgressContext = createContext<ReadingProgress>(INITIAL)

function sameProgress(a: ReadingProgress, b: ReadingProgress) {
  return (
    a.percent === b.percent &&
    a.activeId === b.activeId &&
    a.sectionCount === b.sectionCount &&
    a.sectionIndex === b.sectionIndex &&
    a.sectionTitle === b.sectionTitle
  )
}

function measure(prose: HTMLElement): ReadingProgress {
  const box = prose.getBoundingClientRect()
  const percent = Math.round(Math.min(1, Math.max(0, (window.innerHeight * READING_LINE - box.top) / box.height)) * 100)

  let active: HTMLElement | null = null
  let section: HTMLElement | null = null
  const sections: HTMLElement[] = []
  for (const heading of prose.querySelectorAll<HTMLElement>("h2, h3")) {
    const passed = heading.getBoundingClientRect().top < ACTIVE_HEADING_OFFSET
    if (heading.tagName === "H2") {
      sections.push(heading)
      if (passed || !section) section = heading
    }
    if (passed || !active) active = heading
  }

  return {
    percent,
    activeId: active?.id || null,
    sectionCount: sections.length,
    sectionIndex: section ? sections.indexOf(section) : -1,
    sectionTitle: section?.textContent?.trim() ?? "",
  }
}

/** Owns the page's only scroll listener; throttled to one measurement per animation frame. */
export function ReadingProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ReadingProgress>(INITIAL)

  useEffect(() => {
    const prose = document.getElementById("prose")
    if (!prose) return

    let frame = 0
    const update = () => {
      frame = 0
      const next = measure(prose)
      setProgress((current) => (sameProgress(current, next) ? current : next))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    // Images and fonts change the article's height without a scroll or resize.
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(prose)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      resizeObserver.disconnect()
    }
  }, [])

  return <ReadingProgressContext.Provider value={progress}>{children}</ReadingProgressContext.Provider>
}

export function useReadingProgress(): ReadingProgress {
  return useContext(ReadingProgressContext)
}

/** The 2px line along the bottom of the site header. */
export function ReadBar() {
  const { percent } = useReadingProgress()
  return <div className="read-bar" style={{ transform: `scaleX(${percent / 100})` }} aria-hidden="true" />
}
