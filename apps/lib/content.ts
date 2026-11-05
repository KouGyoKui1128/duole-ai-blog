import { fetchPublic } from "@/lib/public-api"

const MAX_PAGE_SIZE = 50

export interface Tag {
  id?: number
  name: string
  slug: string
  color: string
}

export interface Article {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  published_at: string
  read_time: number
  tags: Tag[]
}

export interface Project {
  id: number
  title: string
  slug: string
  summary: string
  description: string
  tech_stack: string[]
  repo_url: string
  demo_url: string | null
  cover_url: string | null
}

export interface Resume {
  id: number
  name: string
  title: string
  bio: string
  email: string
  github: string
  website: string
  skills: { category: string; items: string[] }[]
  experience: { company: string; role: string; period: string; description: string }[]
  education: { school: string; degree: string; period: string }[]
}

interface Paginated<T> {
  items: T[]
  page: number
  total_pages: number
}

async function getData<T>(path: string): Promise<T> {
  const res = await fetchPublic(path)
  if (!res.ok) throw new Error(`failed to fetch ${path}`)
  const json = await res.json()
  return json.data as T
}

export async function getLatestArticles(limit: number): Promise<Article[]> {
  const data = await getData<Paginated<Article>>(`/articles?page=1&page_size=${limit}`)
  return data.items
}

// The list API has no keyword filter, and tag counts need every article, so the
// blog page filters this full list on the server. A single-author blog is small.
export async function getAllArticles(): Promise<Article[]> {
  const first = await getData<Paginated<Article>>(`/articles?page=1&page_size=${MAX_PAGE_SIZE}`)
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.total_pages - 1, 0) }, (_, index) =>
      getData<Paginated<Article>>(`/articles?page=${index + 2}&page_size=${MAX_PAGE_SIZE}`)
    )
  )
  return [first, ...rest].flatMap((page) => page.items)
}

export async function getArticle(slug: string): Promise<Article | null> {
  return getData<Article | null>(`/articles/${encodeURIComponent(slug)}`)
}

export async function getRelatedArticles(slug: string): Promise<Article[]> {
  return getData<Article[]>(`/articles/${encodeURIComponent(slug)}/related?limit=2`)
}

export async function getTags(): Promise<Tag[]> {
  return getData<Tag[]>("/tags")
}

export async function getProjects(page = 1, pageSize = 10): Promise<Paginated<Project>> {
  return getData<Paginated<Project>>(`/projects?page=${page}&page_size=${pageSize}`)
}

export async function getProject(slug: string): Promise<Project | null> {
  return getData<Project | null>(`/projects/${encodeURIComponent(slug)}`)
}

export async function getResume(): Promise<Resume | null> {
  return getData<Resume | null>("/resume")
}
