import type { Metadata } from "next"

import { ArticleIndex, type ArticleIndexParams } from "@/components/blog/article-index"

export const metadata: Metadata = { title: "English" }

export default async function EnglishPage({ searchParams }: { searchParams: Promise<ArticleIndexParams> }) {
  return <ArticleIndex language="en" params={await searchParams} />
}
