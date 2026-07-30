'use client'

import { useEffect, useState } from "react"
import { Edit, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createProject, deleteProject, getProjects, updateProject, type ProjectItem } from "@/lib/admin-api"

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [techStack, setTechStack] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [demoUrl, setDemoUrl] = useState("")

  const loadProjects = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getProjects()
      setProjects(data)
    } catch {
      setError("加载项目失败")
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
        cover_url: "",
      })
      setTitle("")
      setSlug("")
      setSummary("")
      setDescription("")
      setTechStack("")
      setRepoUrl("")
      setDemoUrl("")
      await loadProjects()
    } catch {
      setError("创建项目失败")
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
      await loadProjects()
    } catch {
      setError("更新项目失败")
    }
  }

  const handleDelete = async (projectId: number) => {
    try {
      await deleteProject(projectId)
      await loadProjects()
    } catch {
      setError("删除项目失败，可能没有权限")
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
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tech_stack.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
    </div>
  )
}
