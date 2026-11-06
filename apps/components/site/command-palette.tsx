'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { useTheme } from "@/components/theme-provider"
import { articlePath } from "@/lib/article-language"
import { searchSite, type SearchResults } from "@/lib/search-api"

const SEARCH_DEBOUNCE_MS = 220

interface PaletteItem {
  id: string
  group: string
  title: string
  meta?: string
  href?: string
  run?: () => void
}

interface FinishedSearch extends SearchResults {
  query: string
  failed: boolean
}

const PAGES: PaletteItem[] = [
  { id: "page-home", group: "页面", title: "首页", href: "/" },
  { id: "page-blog", group: "页面", title: "全部文章", href: "/blog" },
  { id: "page-projects", group: "页面", title: "全部项目", href: "/projects" },
  { id: "page-resume", group: "页面", title: "简历", href: "/resume" },
]

const NO_SEARCH: FinishedSearch = { query: "", articles: [], projects: [], failed: false }

function subscribeToNothing() {
  return () => {}
}

function getHotkeyLabel() {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (start < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, start + query.length)}</mark>
      {text.slice(start + query.length)}
    </>
  )
}

export function CommandPalette() {
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [search, setSearch] = useState<FinishedSearch>(NO_SEARCH)
  const hotkey = useSyncExternalStore(subscribeToNothing, getHotkeyLabel, () => "Ctrl K")

  const keyword = query.trim()
  const finished = search.query === keyword ? search : NO_SEARCH
  const searching = keyword !== "" && search.query !== keyword

  const lowerKeyword = keyword.toLowerCase()
  const matches = (item: PaletteItem) => !keyword || item.title.toLowerCase().includes(lowerKeyword)
  const items: PaletteItem[] = [
    ...finished.articles.map((article) => ({
      id: `article-${article.id}`,
      group: "文章",
      title: article.title,
      meta: [article.published_at?.slice(5), article.language === "en" ? "EN" : ""].filter(Boolean).join(" · "),
      href: articlePath(article),
    })),
    ...finished.projects.map((project) => ({
      id: `project-${project.id}`,
      group: "项目",
      title: project.title,
      href: `/projects/${project.slug}`,
    })),
    ...PAGES.filter(matches),
    ...[{ id: "action-theme", group: "操作", title: "切换深浅色", run: toggleTheme }].filter(matches),
    ...(keyword
      ? [{
          id: "all-results",
          group: "完整结果",
          title: `查看“${keyword}”的全部结果`,
          href: `/search?q=${encodeURIComponent(keyword)}`,
        }]
      : []),
  ]
  const current = Math.min(active, Math.max(items.length - 1, 0))
  const currentId = items[current]?.id

  useEffect(() => {
    if (!keyword) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchSite(keyword, controller.signal)
        .then((results) => setSearch({ ...results, query: keyword, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ ...NO_SEARCH, query: keyword, failed: true })
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [keyword])

  useEffect(() => {
    if (currentId) document.getElementById(`hit-${currentId}`)?.scrollIntoView({ block: "nearest" })
  }, [currentId])

  const openPalette = () => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    setQuery("")
    setActive(0)
    dialog.showModal()
    inputRef.current?.focus()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        const dialog = dialogRef.current
        if (dialog?.open) dialog.close()
        else openPalette()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return
    dialogRef.current?.close()
    if (item.run) item.run()
    else if (item.href) router.push(item.href)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const count = Math.max(items.length, 1)
      setActive((current + (event.key === "ArrowDown" ? 1 : -1) + count) % count)
    }
    if (event.key === "Enter") {
      event.preventDefault()
      choose(items[current])
    }
  }

  return (
    <>
      <button className="tool" type="button" aria-label="打开全站搜索" onClick={openPalette}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
        <kbd>{hotkey}</kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="palette"
        aria-label="全站搜索"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close()
        }}
      >
        <div className="qline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.6-3.6" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-hits"
            aria-activedescendant={currentId ? `hit-${currentId}` : undefined}
            aria-label="搜索文章、项目和页面"
            autoComplete="off"
            placeholder="搜索文章、项目和页面"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
          />
        </div>

        <div ref={listRef} className="hits" id="palette-hits" role="listbox" aria-label="搜索结果">
          {items.map((item, index) => (
            <div key={item.id} role="presentation">
              {item.group !== items[index - 1]?.group ? <h3>{item.group}</h3> : null}
              <div
                id={`hit-${item.id}`}
                className="hit"
                role="option"
                aria-selected={index === current}
                onClick={() => choose(item)}
                onPointerMove={() => setActive(index)}
              >
                <span><Highlighted text={item.title} query={item.id === "all-results" ? "" : keyword} /></span>
                {item.meta ? <small>{item.meta}</small> : null}
              </div>
            </div>
          ))}
          {searching ? <p className="nohit">正在搜索…</p> : null}
          {finished.failed ? <p className="nohit">搜索暂时不可用，后端可能正在唤醒，请稍后再试。</p> : null}
          {keyword && !searching && !finished.failed && finished.articles.length + finished.projects.length === 0 ? (
            <p className="nohit">没有找到“{keyword}”的文章或项目。</p>
          ) : null}
        </div>

        <div className="keys">
          <span><kbd>↑↓</kbd>选择</span>
          <span><kbd>Enter</kbd>打开</span>
          <span><kbd>Esc</kbd>关闭</span>
        </div>
      </dialog>
    </>
  )
}
