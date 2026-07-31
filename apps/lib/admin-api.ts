import { getClientApiBase } from "@/lib/api-base"

export type UserRole = "admin" | "editor" | "viewer"

export interface CurrentUser {
  id: number
  username: string
  email: string
  role: UserRole
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

export interface ArticleItem {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  published_at: string
  read_time: number
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

export interface UserItem {
  id: number
  username: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

const API_BASE = getClientApiBase()

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const json = await res.json()
      if (json?.detail) {
        message = String(json.detail)
      } else if (json?.message) {
        message = String(json.message)
      }
    } catch {
      const text = await res.text()
      if (text) message = text
    }
    throw new Error(message)
  }

  const json = await res.json()
  return json.data as T
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<void> {
  await apiFetch<boolean>("/auth/logout", { method: "POST" })
}

export async function getMe(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me")
}

export async function getUsers(): Promise<UserItem[]> {
  return apiFetch<UserItem[]>("/users")
}

export async function createUser(payload: {
  username: string
  email: string
  password: string
  role: UserRole
}): Promise<UserItem> {
  return apiFetch<UserItem>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateUser(
  userId: number,
  payload: { username?: string; role?: UserRole; is_active?: boolean; password?: string }
): Promise<UserItem> {
  return apiFetch<UserItem>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteUser(userId: number): Promise<void> {
  await apiFetch<boolean>(`/users/${userId}`, { method: "DELETE" })
}

export async function getArticles(): Promise<ArticleItem[]> {
  return apiFetch<ArticleItem[]>("/articles")
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
}): Promise<ArticleItem> {
  return apiFetch<ArticleItem>("/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  })
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

export async function getProjects(): Promise<ProjectItem[]> {
  return apiFetch<ProjectItem[]>("/projects")
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

export async function getResume(): Promise<ResumeItem> {
  return apiFetch<ResumeItem>("/resume")
}

export async function updateResume(payload: Omit<ResumeItem, "id" | "created_by" | "updated_by">): Promise<ResumeItem> {
  return apiFetch<ResumeItem>("/resume", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
