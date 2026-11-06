import type { Metadata } from "next"

import { ArticleIndex, type ArticleIndexParams } from "@/components/blog/article-index"

export const metadata: Metadata = { title: "博客" }

export default async function BlogPage({ searchParams }: { searchParams: Promise<ArticleIndexParams> }) {
  return <ArticleIndex language="zh" params={await searchParams} />
}
