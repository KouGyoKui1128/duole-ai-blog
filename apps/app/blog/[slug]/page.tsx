import type { Metadata } from "next"

import { ArticleDetail, articleMetadata } from "@/components/blog/article-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return articleMetadata({ slug, language: "zh" })
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  return <ArticleDetail slug={slug} language="zh" />
}
