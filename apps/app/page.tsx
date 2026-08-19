import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getServerApiBase } from "@/lib/api-base"
import Link from "next/link"
import { ArrowRight, Clock, Calendar } from "lucide-react"

interface HomeTag {
  id?: number
  name: string
  slug: string
  color: string
}

interface HomeArticle {
  id: number
  title: string
  slug: string
  summary: string
  published_at: string
  read_time: number
  tags: HomeTag[]
}

interface HomeProject {
  id: number
  title: string
  slug: string
  summary: string
  tech_stack: string[]
}

async function getHomeData() {
  const apiBase = getServerApiBase()
  const [articlesRes, projectsRes, tagsRes] = await Promise.all([
    fetch(`${apiBase}/articles`, { cache: "no-store" }),
    fetch(`${apiBase}/projects`, { cache: "no-store" }),
    fetch(`${apiBase}/tags`, { cache: "no-store" }),
  ])

  if (!articlesRes.ok) throw new Error("failed to fetch articles")
  if (!projectsRes.ok) throw new Error("failed to fetch projects")
  if (!tagsRes.ok) throw new Error("failed to fetch tags")

  const [articlesJson, projectsJson, tagsJson] = await Promise.all([
    articlesRes.json(),
    projectsRes.json(),
    tagsRes.json(),
  ])

  const rawArticles: HomeArticle[] = Array.isArray(articlesJson.data?.items) ? articlesJson.data.items as HomeArticle[] : []
  const rawProjects: HomeProject[] = Array.isArray(projectsJson.data?.items) ? projectsJson.data.items as HomeProject[] : []
  const rawTags: HomeTag[] = Array.isArray(tagsJson.data) ? tagsJson.data as HomeTag[] : []

  return {
    articles: rawArticles.map((article) => ({
      ...article,
      tags: Array.isArray(article.tags) ? article.tags : [],
    })),
    projects: rawProjects.map((project) => ({
      ...project,
      tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
    })),
    tags: rawTags,
  }
}

export default async function HomePage() {
  const { articles, projects, tags } = await getHomeData()
  const featuredArticles = articles.slice(0, 4)
  const featuredProjects = projects.slice(0, 3)

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">DuoLe AI Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              记录 LangChain、LangGraph、AI Agent 的学习旅程，探索 AI 应用的无限可能
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/blog"><Button size="lg">浏览博客 <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/projects"><Button variant="outline" size="lg">查看项目</Button></Link>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">最新文章</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <Link key={tag.slug} href={"/blog?tag=" + tag.slug}>
                  <Badge variant="secondary" className="cursor-pointer hover:opacity-80 text-sm px-3 py-1">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">最新文章</h2>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              浏览博客 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredArticles.map((article) => (
              <Link key={article.id} href={"/blog/" + article.slug}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>{article.published_at}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{article.read_time} 分钟</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <Badge key={tag.slug} variant="secondary" className="text-xs">{tag.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">最新项目</h2>
              <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                浏览项目 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredProjects.map((project) => (
                <Link key={project.id} href={"/projects/" + project.slug}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-2">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{project.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech_stack.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{project.tech_stack.length - 3}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
