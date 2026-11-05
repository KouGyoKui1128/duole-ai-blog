import { CLIENT_API_BASE } from "@/lib/api-base"

export interface SearchHit {
  id: number
  title: string
  slug: string
  published_at?: string
}

export interface SearchResults {
  articles: SearchHit[]
  projects: SearchHit[]
}

export async function searchSite(query: string, signal: AbortSignal): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query, scope: "all", page: "1", page_size: "5" })
  const res = await fetch(`${CLIENT_API_BASE}/search?${params.toString()}`, { signal })
  if (!res.ok) throw new Error("search failed")
  const json = await res.json()
  return { articles: json.data.articles, projects: json.data.projects }
}
