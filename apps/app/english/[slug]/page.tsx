import type { Metadata } from "next"

import { ArticleDetail, articleMetadata } from "@/components/blog/article-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return articleMetadata({ slug, language: "en" })
}

export default async function EnglishArticlePage({ params }: Props) {
  const { slug } = await params
  return <ArticleDetail slug={slug} language="en" />
}
