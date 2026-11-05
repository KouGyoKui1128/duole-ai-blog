import Link from "next/link"

import { ProjectCard } from "@/components/blog/project-card"
import { AgentRun } from "@/components/home/agent-run"
import { ArticleRows } from "@/components/home/article-rows"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ArrowIcon } from "@/components/site/arrow-icon"
import { CopyEmailButton } from "@/components/site/copy-button"
import { getLatestArticles, getProjects, getResume } from "@/lib/content"
import { articleCoverKind } from "@/lib/cover-art"

const HOME_ARTICLE_COUNT = 5
const HOME_PROJECT_COUNT = 2
const HOME_STACK_LIMIT = 4

export default async function HomePage() {
  const [articles, projectPage, resume] = await Promise.all([
    getLatestArticles(HOME_ARTICLE_COUNT),
    getProjects(1, HOME_PROJECT_COUNT),
    getResume(),
  ])
  const projects = projectPage.items
  const rows = articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    publishedAt: article.published_at,
    readTime: article.read_time,
    coverKind: articleCoverKind(article.tags),
  }))

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page">
          <section className="hero">
            <AgentRun />
            <div className="wrap">
              {resume?.title ? <span className="label">{resume.title}</span> : null}
              <h1 className="serif">
                构建 <em>AI Agent</em>，<br />把过程写下来。
              </h1>
              <p className="lead">
                我是 {resume?.name || "DuoLe"}。这里有我做过的项目、学习 LangChain 与 LangGraph 的笔记，以及我的简历。
              </p>
              <div className="cta">
                <Link className="btn solid" href="/projects">看项目 <ArrowIcon /></Link>
                <Link className="btn" href="/resume">读简历</Link>
              </div>
            </div>
          </section>

          {projects.length > 0 ? (
            <section className="wrap sec">
              <div className="sec-head">
                <h2 className="serif">项目</h2>
                <Link className="more" href="/projects">全部项目</Link>
              </div>
              <div className="works">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} stackLimit={HOME_STACK_LIMIT} />
                ))}
              </div>
            </section>
          ) : null}

          {rows.length > 0 ? (
            <section className={projects.length > 0 ? "wrap sec-tail" : "wrap sec"}>
              <div className="sec-head">
                <h2 className="serif">最新文章</h2>
                <Link className="more" href="/blog">全部文章</Link>
              </div>
              <ArticleRows rows={rows} />
            </section>
          ) : null}

          {resume?.email ? (
            <section className="contact">
              <div className="wrap sec inner">
                <h2 className="serif">想聊聊 AI 应用？</h2>
                <div className="mail">
                  <span>{resume.email}</span>
                  <CopyEmailButton email={resume.email} />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}
