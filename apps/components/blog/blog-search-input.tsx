'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"

const FILTER_DEBOUNCE_MS = 250

interface BlogSearchInputProps {
  query: string
  tag: string
  language: ArticleLanguage
}

export function BlogSearchInput({ query, tag, language }: BlogSearchInputProps) {
  const router = useRouter()
  const timerRef = useRef(0)
  const [value, setValue] = useState(query)
  const [urlQuery, setUrlQuery] = useState(query)
  const [typing, setTyping] = useState(false)
  const { path, searchPlaceholder } = SECTION_COPY[language]

  // Follow outside changes such as clearing the filters, without undoing what is being typed.
  if (query !== urlQuery) {
    setUrlQuery(query)
    if (!typing) setValue(query)
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const onChange = (next: string) => {
    setValue(next)
    setTyping(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setTyping(false)
      const params = new URLSearchParams()
      if (tag) params.set("tag", tag)
      if (next.trim()) params.set("q", next.trim())
      const search = params.toString()
      router.replace(search ? `${path}?${search}` : path, { scroll: false })
    }, FILTER_DEBOUNCE_MS)
  }

  return (
    <label className="find">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.6-3.6" />
      </svg>
      <input
        type="search"
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
