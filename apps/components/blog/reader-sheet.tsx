'use client'

import { useRef, useState } from "react"

import { RailSections } from "@/components/blog/article-rail"
import { useReadingProgress } from "@/components/blog/reading-progress"
import { Dialog, DialogTitle } from "@/components/ui/dialog"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import type { ArticleSeries } from "@/lib/content"
import type { Heading } from "@/lib/markdown"

interface ReaderSheetProps {
  headings: Heading[]
  series: ArticleSeries | null
  language: ArticleLanguage
  readMinutes: number
}

/** Below 900px the right-hand column folds into this button and a sheet that slides up from the bottom. */
export function ReaderSheet({ headings, series, language, readMinutes }: ReaderSheetProps) {
  const { percent } = useReadingProgress()
  const [open, setOpen] = useState(false)
  const pillRef = useRef<HTMLButtonElement>(null)
  // Where to scroll once the sheet has closed and the page can scroll again.
  const targetRef = useRef<string | null>(null)
  const copy = SECTION_COPY[language]

  const navigate = (targetId: string) => {
    targetRef.current = targetId
    setOpen(false)
  }

  // Radix only returns focus to its own Dialog.Trigger, so send it back to the button here.
  const afterClose = (event: Event) => {
    event.preventDefault()
    pillRef.current?.focus({ preventScroll: true })
    const targetId = targetRef.current
    targetRef.current = null
    if (targetId) document.getElementById(targetId)?.scrollIntoView({ block: "start" })
  }

  return (
    <>
      <button ref={pillRef} className="pill" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span>{copy.reader.sheetButton}</span>
        <b>{percent}%</b>
      </button>
      <Dialog open={open} onOpenChange={setOpen} className="sheet" described={false} onCloseAutoFocus={afterClose}>
        <header className="sheet-head">
          <DialogTitle className="sheet-title">{copy.reader.sheetButton}</DialogTitle>
          <button type="button" onClick={() => setOpen(false)}>{copy.reader.close}</button>
        </header>
        <RailSections
          headings={headings}
          series={series}
          language={language}
          readMinutes={readMinutes}
          withProgress
          onNavigate={navigate}
        />
      </Dialog>
    </>
  )
}
