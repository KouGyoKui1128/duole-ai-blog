import Link from "next/link"

import { Cover } from "@/components/blog/cover"
import type { Article } from "@/lib/content"
import { articleCoverKind } from "@/lib/cover-art"

export function articleMeta(article: Pick<Article, "published_at" | "read_time">): string {
  return `${article.published_at} · ${article.read_time} 分钟`
}

export function PostCard({ article }: { article: Article }) {
  return (
    <Link className="post" href={`/blog/${article.slug}`}>
      <Cover kind={articleCoverKind(article.tags)} seed={article.slug} label={article.title} />
      <span className="label">{articleMeta(article)}</span>
      <h3 className="serif">{article.title}</h3>
      <p>{article.summary}</p>
    </Link>
  )
}

export function LeadPost({ article }: { article: Article }) {
  return (
    <Link className="lead-post" href={`/blog/${article.slug}`}>
      <Cover kind={articleCoverKind(article.tags)} seed={article.slug} label={article.title} />
      <div className="txt">
        <span className="label">最新 · {articleMeta(article)}</span>
        <h2 className="serif">{article.title}</h2>
        <p>{article.summary}</p>
      </div>
    </Link>
  )
}
