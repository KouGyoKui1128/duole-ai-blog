import { uploadPresigned } from "@vercel/blob/client"

import { CLIENT_API_BASE as API_BASE } from "@/lib/api-base"

export interface CurrentUser {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface TagItem {
  id: number
  name: string
  slug: string
  color: string
}

export interface ArticleTagItem {
  name: string
  slug: string
  color: string
}

export interface UploadedImageItem {
  url: string
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ArticleItem {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  published_at: string
  read_time: number
  is_public: boolean
  created_by: number | null
  updated_by: number | null
  tags: ArticleTagItem[]
}

export interface ProjectItem {
  id: number
  title: string
  slug: string
  summary: string
  description: string
  tech_stack: string[]
  repo_url: string
  demo_url: string | null
  cover_url: string | null
  is_public: boolean
  created_by: number | null
  updated_by: number | null
}

export interface ResumeItem {
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
  created_by?: number | null
  updated_by?: number | null
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    if (Array.isArray(json?.detail)) {
      return json.detail
        .map((item: { loc?: string[]; msg?: string }) => {
          const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "field"
          return `${String(field)}: ${item?.msg || "invalid value"}`
        })
        .join("; ")
    }
    if (typeof json?.detail === "string") return json.detail
    if (json?.detail) return JSON.stringify(json.detail)
    if (json?.message) return String(json.message)
  } catch {
    // Not JSON: a proxy error page while the backend is waking up.
  }
  return res.status >= 500 ? "后端正在唤醒，请约一分钟后重试" : `Request failed: ${res.status}`
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) throw new Error(await readErrorMessage(res))

  const isContentWrite = init?.method !== undefined && init.method !== "GET" && !path.startsWith("/auth/")
  if (isContentWrite) {
    await fetch("/api/revalidate", { method: "POST", credentials: "include" }).catch(() => undefined)
  }

  const json = await res.json()
  return json.data as T
}

function normalizePaginatedResponse<T>(data: PaginatedResponse<T> | null): PaginatedResponse<T> {
  if (!data || !Array.isArray(data.items)) {
    return { items: [], page: 1, page_size: 0, total: 0, total_pages: 0 }
  }
  return {
    items: data.items,
    page: Number.isFinite(data.page) ? data.page : 1,
    page_size: Number.isFinite(data.page_size) ? data.page_size : data.items.length,
    total: Number.isFinite(data.total) ? data.total : data.items.length,
    total_pages: Number.isFinite(data.total_pages) ? data.total_pages : 0,
  }
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await apiFetch<boolean>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  })
}

export async function logout(): Promise<void> {
  await apiFetch<boolean>("/auth/logout", { method: "POST" })
}

export async function getMe(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me")
}

export async function getArticles(
  page = 1,
  pageSize = 50,
): Promise<PaginatedResponse<ArticleItem>> {
  const data = await apiFetch<PaginatedResponse<ArticleItem> | null>(`/articles/admin?page=${page}&page_size=${pageSize}`)
  return normalizePaginatedResponse(data)
}

export async function getTags(): Promise<TagItem[]> {
  return apiFetch<TagItem[]>("/tags")
}

export async function createTag(payload: {
  name: string
  slug: string
  color: string
}): Promise<TagItem> {
  return apiFetch<TagItem>("/tags", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateTag(
  tagId: number,
  payload: {
    name: string
    slug: string
    color: string
  }
): Promise<TagItem> {
  return apiFetch<TagItem>(`/tags/${tagId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteTag(tagId: number): Promise<void> {
  await apiFetch<boolean>(`/tags/${tagId}`, { method: "DELETE" })
}

export async function createArticle(payload: {
  title: string
  slug: string
  summary: string
  content: string
  published_at: string
  read_time: number
  tag_slugs: string[]
  is_public: boolean
}): Promise<ArticleItem> {
  return apiFetch<ArticleItem>("/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

async function uploadImage(folder: string, file: File): Promise<UploadedImageItem> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png"
  const blob = await uploadPresigned(`${folder}/${crypto.randomUUID()}.${extension}`, file, {
    access: "public",
    handleUploadUrl: "/api/uploads",
  })
  return { url: blob.url }
}

export async function uploadArticleImage(file: File): Promise<UploadedImageItem> {
  return uploadImage("articles", file)
}

export async function uploadProjectCover(file: File): Promise<UploadedImageItem> {
  return uploadImage("projects", file)
}

export async function updateArticle(
  articleId: number,
  payload: {
    title: string
    slug: string
    summary: string
    content: string
    published_at: string
    read_time: number
    tag_slugs: string[]
  }
): Promise<ArticleItem> {
  return apiFetch<ArticleItem>(`/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteArticle(articleId: number): Promise<void> {
  await apiFetch<boolean>(`/articles/${articleId}`, { method: "DELETE" })
}

export async function setArticlePublished(articleId: number, isPublic: boolean): Promise<ArticleItem> {
  return apiFetch<ArticleItem>(`/articles/${articleId}/publish`, {
    method: "POST",
    body: JSON.stringify({ is_public: isPublic }),
  })
}

export async function getProjects(
  page = 1,
  pageSize = 50,
): Promise<PaginatedResponse<ProjectItem>> {
  const data = await apiFetch<PaginatedResponse<ProjectItem> | null>(`/projects/admin?page=${page}&page_size=${pageSize}`)
  return normalizePaginatedResponse(data)
}

export async function createProject(payload: {
  title: string
  slug: string
  summary: string
  description: string
  tech_stack: string[]
  repo_url: string
  demo_url: string | null
  cover_url: string | null
}): Promise<ProjectItem> {
  return apiFetch<ProjectItem>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateProject(
  projectId: number,
  payload: {
    title: string
    slug: string
    summary: string
    description: string
    tech_stack: string[]
    repo_url: string
    demo_url: string | null
    cover_url: string | null
  }
): Promise<ProjectItem> {
  return apiFetch<ProjectItem>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteProject(projectId: number): Promise<void> {
  await apiFetch<boolean>(`/projects/${projectId}`, { method: "DELETE" })
}

export async function setProjectPublished(projectId: number, isPublic: boolean): Promise<ProjectItem> {
  return apiFetch<ProjectItem>(`/projects/${projectId}/publish`, {
    method: "POST",
    body: JSON.stringify({ is_public: isPublic }),
  })
}

export async function getResume(): Promise<ResumeItem | null> {
  return apiFetch<ResumeItem | null>("/resume")
}

export async function updateResume(payload: Omit<ResumeItem, "id" | "created_by" | "updated_by">): Promise<ResumeItem> {
  return apiFetch<ResumeItem>("/resume", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
