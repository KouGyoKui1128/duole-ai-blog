import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getServerApiBase } from "@/lib/api-base"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface ProjectItem {
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

async function getProjectsData(): Promise<ProjectItem[]> {
  const res = await fetch(`${getServerApiBase()}/projects`, { cache: "no-store" })
  if (!res.ok) throw new Error("failed to fetch projects")
  const json = await res.json()
  const rawProjects: ProjectItem[] = Array.isArray(json.data) ? json.data as ProjectItem[] : []
  return rawProjects.map((project) => ({
    ...project,
    tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
    cover_url: typeof project.cover_url === "string" && project.cover_url.length > 0 ? project.cover_url : null,
  }))
}

export default async function ProjectsPage() {
  const projects = await getProjectsData()

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">项目</h1>
        <p className="text-muted-foreground mb-8">我的开源项目与作品</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                {project.cover_url ? (
                  <div className="mb-4 overflow-hidden rounded-lg border border-border">
                    <img src={project.cover_url} alt={project.title} className="h-44 w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex-1">
                  <h2 className="font-semibold text-lg mb-2">{project.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{project.summary}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech_stack.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Link href={project.repo_url} target="_blank">
                    <Button variant="ghost" size="sm"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-1"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>演示</Button>
                  </Link>
                  {project.demo_url && (
                    <Link href={project.demo_url} target="_blank">
                      <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" />演示</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
