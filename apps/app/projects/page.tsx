import type { Metadata } from "next"

import { ProjectCard } from "@/components/blog/project-card"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Pagination } from "@/components/ui/pagination"
import { getProjects } from "@/lib/content"

export const metadata: Metadata = { title: "项目" }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1)
  const { items: projects, total_pages: totalPages } = await getProjects(page)

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page wrap">
          <header className="head">
            <h1 className="serif">项目</h1>
            <p>我做过的 AI 应用与开源作品</p>
          </header>

          {projects.length === 0 ? (
            <div className="empty">
              <h2 className="serif">还没有项目</h2>
              <p>做好之后会放在这里。</p>
            </div>
          ) : (
            <div className="works">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="list-end">
            <Pagination page={page} totalPages={totalPages} createHref={(nextPage) => `/projects?page=${nextPage}`} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
