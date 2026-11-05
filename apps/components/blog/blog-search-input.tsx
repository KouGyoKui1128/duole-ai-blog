'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const FILTER_DEBOUNCE_MS = 250

export function BlogSearchInput({ query, tag }: { query: string; tag: string }) {
  const router = useRouter()
  const timerRef = useRef(0)
  const [value, setValue] = useState(query)
  const [urlQuery, setUrlQuery] = useState(query)
  const [typing, setTyping] = useState(false)

  // Follow outside changes such as 清除筛选, without undoing what is being typed.
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
      router.replace(search ? `/blog?${search}` : "/blog", { scroll: false })
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
        placeholder="搜索标题或摘要"
        aria-label="搜索标题或摘要"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
