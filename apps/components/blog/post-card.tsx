import Link from "next/link"

import { Cover } from "@/components/blog/cover"
import { articlePath, SECTION_COPY } from "@/lib/article-language"
import type { Article } from "@/lib/content"
import { articleCoverKind } from "@/lib/cover-art"

export function articleMeta(article: Pick<Article, "published_at" | "read_time" | "language">): string {
  return `${article.published_at} · ${SECTION_COPY[article.language].readTime(article.read_time)}`
}

function ArticleCover({ article }: { article: Article }) {
  return <Cover kind={articleCoverKind(article.tags)} seed={article.slug} label={article.title} language={article.language} />
}

export function PostCard({ article }: { article: Article }) {
  return (
    <Link className="post" href={articlePath(article)}>
      <ArticleCover article={article} />
      <span className="label">{articleMeta(article)}</span>
      <h3 className="serif">{article.title}</h3>
      <p>{article.summary}</p>
    </Link>
  )
}

export function LeadPost({ article }: { article: Article }) {
  return (
    <Link className="lead-post" href={articlePath(article)}>
      <ArticleCover article={article} />
      <div className="txt">
        <span className="label">{SECTION_COPY[article.language].latest} · {articleMeta(article)}</span>
        <h2 className="serif">{article.title}</h2>
        <p>{article.summary}</p>
      </div>
    </Link>
  )
}
