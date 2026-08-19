import { getClientApiBase } from "@/lib/api-base"

export type UserRole = "admin" | "editor"

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

export interface UploadedImageItem {
  url: string
  path: string
  filename: string
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
  review_reason: string | null
  reviewed_by: number | null
  reviewed_at: string | null
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
  review_reason: string | null
  reviewed_by: number | null
  reviewed_at: string | null
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

export interface UserApplicationItem {
  id: number
  username: string
  email: string
  requested_role: "editor"
  motivation: string
  status: "pending" | "approved" | "rejected"
  status_label: string
  initial_password: string | null
  review_note: string | null
  reviewed_by: number | null
  reviewed_at: string | null
  created_user_id: number | null
  created_at: string
}

export interface ApplicationStatusItem {
  id: number
  username: string
  email: string
  status: "pending" | "approved" | "rejected"
  status_label: string
  initial_password: string | null
  reviewed_at: string | null
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
      if (Array.isArray(json?.detail)) {
        message = json.detail
          .map((item: { loc?: string[]; msg?: string }) => {
            const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "field"
            return `${String(field)}: ${item?.msg || "invalid value"}`
          })
          .join("; ")
      } else if (typeof json?.detail === "string") {
        message = json.detail
      } else if (json?.detail) {
        message = JSON.stringify(json.detail)
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

export async function queryApplicationStatus(email: string): Promise<ApplicationStatusItem | null> {
  const res = await fetch(`${API_BASE}/applications/status?email=${encodeURIComponent(email)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const json = await res.json()
      if (typeof json?.detail === "string") message = json.detail
    } catch {
      const text = await res.text()
      if (text) message = text
    }
    throw new Error(message)
  }

  const json = await res.json()
  return (json.data as ApplicationStatusItem | null) ?? null
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

export async function createApplication(payload: {
  username: string
  email: string
  requested_role: "editor"
  motivation: string
}): Promise<UserApplicationItem> {
  return apiFetch<UserApplicationItem>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getApplications(): Promise<UserApplicationItem[]> {
  return apiFetch<UserApplicationItem[]>("/applications")
}

export async function reviewApplication(
  applicationId: number,
  payload: { status: "approved" | "rejected"; review_note?: string | null }
): Promise<UserApplicationItem> {
  return apiFetch<UserApplicationItem>(`/applications/${applicationId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
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
}): Promise<ArticleItem> {
  return apiFetch<ArticleItem>("/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function uploadArticleImage(file: File): Promise<UploadedImageItem> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/uploads/images`, {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const json = await res.json()
      if (typeof json?.detail === "string") {
        message = json.detail
      }
    } catch {
      const text = await res.text()
      if (text) message = text
    }
    throw new Error(message)
  }

  const json = await res.json()
  return json.data as UploadedImageItem
}

export async function uploadProjectCover(file: File): Promise<UploadedImageItem> {
  return uploadArticleImage(file)
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

export async function reviewArticle(
  articleId: number,
  payload: { is_public: boolean; review_reason?: string | null }
): Promise<ArticleItem> {
  return apiFetch<ArticleItem>(`/articles/${articleId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
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

export async function reviewProject(
  projectId: number,
  payload: { is_public: boolean; review_reason?: string | null }
): Promise<ProjectItem> {
  return apiFetch<ProjectItem>(`/projects/${projectId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
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
