'use client'

import { useEffect, useRef, useState } from "react"
import { Edit, ImagePlus, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createProject, deleteProject, getProjects, reviewProject, updateProject, uploadProjectCover, type ProjectItem } from "@/lib/admin-api"

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [demoUrl, setDemoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [uploadingCreateCover, setUploadingCreateCover] = useState(false)
  const [uploadingProjectId, setUploadingProjectId] = useState<number | null>(null)
  const createCoverInputRef = useRef<HTMLInputElement | null>(null)
  const editCoverInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const loadProjects = async (nextPage = page) => {
    setLoading(true)
    setError("")
    try {
      const data = await getProjects(nextPage, 10)
      setProjects(data.items)
      setPage(data.page)
      setTotalPages(data.total_pages)
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载项目失败"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async () => {
    setError("")
    try {
      await createProject({
        title,
        slug,
        summary,
        description,
        tech_stack: techStack.split(",").map((item) => item.trim()).filter(Boolean),
        repo_url: repoUrl,
        demo_url: demoUrl || null,
        cover_url: coverUrl || null,
      })
      setTitle("")
      setSlug("")
      setSummary("")
      setDescription("")
      setTechStack("")
      setRepoUrl("")
      setDemoUrl("")
      setCoverUrl("")
      await loadProjects(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建项目失败"
      setError(message)
    }
  }

  const handleEdit = async (project: ProjectItem) => {
    const nextTitle = window.prompt("项目标题", project.title)
    if (!nextTitle) return
    try {
      await updateProject(project.id, {
        title: nextTitle,
        slug: project.slug,
        summary: project.summary,
        description: project.description,
        tech_stack: project.tech_stack,
        repo_url: project.repo_url,
        demo_url: project.demo_url,
        cover_url: project.cover_url,
      })
      await loadProjects(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新项目失败"
      setError(message)
    }
  }

  const handleDelete = async (projectId: number) => {
    try {
      await deleteProject(projectId)
      await loadProjects(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除项目失败，可能没有权限"
      setError(message)
    }
  }

  const handleReview = async (project: ProjectItem, isPublic: boolean) => {
    try {
      await reviewProject(project.id, {
        is_public: isPublic,
        review_reason: isPublic ? null : "已下架",
      })
      await loadProjects(page)
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新审核状态失败"
      setError(message)
    }
  }

  const handleCreateCoverSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    setUploadingCreateCover(true)
    try {
      const uploaded = await uploadProjectCover(file)
      setCoverUrl(uploaded.url)
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传封面失败"
      setError(message)
    } finally {
      setUploadingCreateCover(false)
      event.target.value = ""
    }
  }

  const handleReplaceCover = async (project: ProjectItem, file: File) => {
    setError("")
    setUploadingProjectId(project.id)
    try {
      const uploaded = await uploadProjectCover(file)
      await updateProject(project.id, {
        title: project.title,
        slug: project.slug,
        summary: project.summary,
        description: project.description,
        tech_stack: project.tech_stack,
        repo_url: project.repo_url,
        demo_url: project.demo_url,
        cover_url: uploaded.url,
      })
      await loadProjects()
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新封面失败"
      setError(message)
    } finally {
      setUploadingProjectId(null)
      const input = editCoverInputRefs.current[project.id]
      if (input) {
        input.value = ""
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">项目管理</h1>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">正在加载项目...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-2">
          <Input placeholder="项目标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="摘要" value={summary} onChange={(e) => setSummary(e.target.value)} />
          <Input placeholder="技术栈，使用逗号分隔" value={techStack} onChange={(e) => setTechStack(e.target.value)} />
          <Input placeholder="仓库地址" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
          <Input placeholder="演示地址(可选)" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
          <div className="md:col-span-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Input placeholder="封面图 URL（可上传自动填充）" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
            <div className="flex items-center gap-2">
              <input ref={createCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCreateCoverSelect} />
              <Button variant="outline" type="button" onClick={() => createCoverInputRef.current?.click()} disabled={uploadingCreateCover}>
                <ImagePlus className="h-4 w-4 mr-1" />{uploadingCreateCover ? "上传中..." : "上传封面"}
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Textarea placeholder="项目描述" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" />新建项目</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-4">
              {project.cover_url ? (
                <div className="mb-4 overflow-hidden rounded-lg border border-border">
                  <img src={project.cover_url} alt={project.title} className="h-40 w-full object-cover" />
                </div>
              ) : null}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.summary}</p>
                    <Badge variant={project.is_public ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                      {project.is_public ? "通过" : "审核中"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tech_stack.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    ref={(element) => {
                      editCoverInputRefs.current[project.id] = element
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        handleReplaceCover(project, file)
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => editCoverInputRefs.current[project.id]?.click()}
                    disabled={uploadingProjectId === project.id}
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0" onClick={() => handleReview(project, !project.is_public)}>
                    {project.is_public ? "撤销" : "通过"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleEdit(project)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        createHref={(nextPage) => `/admin/projects?page=${nextPage}`}
      />
    </div>
  )
}
