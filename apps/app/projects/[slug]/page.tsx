import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Cover } from "@/components/blog/cover"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ArrowIcon } from "@/components/site/arrow-icon"
import { getProject, getProjects } from "@/lib/content"
import { projectCoverKind } from "@/lib/cover-art"

const MAX_PROJECTS = 50

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  return project ? { title: project.title, description: project.summary } : {}
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const [project, projectPage] = await Promise.all([getProject(slug), getProjects(1, MAX_PROJECTS)])
  if (!project) notFound()

  const projects = projectPage.items
  const position = projects.findIndex((item) => item.slug === project.slug)
  const nextProject = projects.length > 1 ? projects[(position + 1) % projects.length] : null
  const paragraphs = project.description.split(/\n+/).filter((paragraph) => paragraph.trim())

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page">
          <div className="wrap">
            <header className="ahead">
              <Link className="more" href="/projects">返回项目</Link>
              <h1 className="serif">{project.title}</h1>
              <p className="sum">{project.summary}</p>
            </header>
          </div>

          <div className="wrap">
            <div className="acover">
              <Cover kind={projectCoverKind(project.slug)} seed={project.slug} label={project.title} coverUrl={project.cover_url} />
            </div>
          </div>

          <div className="wrap pgrid">
            <div className="prose">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <div className="cta">
                {project.demo_url ? (
                  <a className="btn solid" href={project.demo_url} target="_blank" rel="noopener noreferrer">
                    在线演示 <ArrowIcon />
                  </a>
                ) : null}
                {project.repo_url ? (
                  <a className={project.demo_url ? "btn" : "btn solid"} href={project.repo_url} target="_blank" rel="noopener noreferrer">
                    查看源码
                  </a>
                ) : null}
              </div>
            </div>
            <aside className="facts">
              <dl>
                <dt className="label">技术栈</dt>
                <dd className="chiplist">
                  {project.tech_stack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </dd>
              </dl>
              {nextProject ? (
                <Link className="more" href={`/projects/${nextProject.slug}`}>下一个项目：{nextProject.title}</Link>
              ) : null}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
