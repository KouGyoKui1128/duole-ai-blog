import { GeneratedCover } from "@/components/blog/generated-cover"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"
import type { CoverKind } from "@/lib/cover-art"

interface CoverProps {
  kind: CoverKind
  seed: string
  label: string
  coverUrl?: string | null
  language?: ArticleLanguage
}

export function Cover({ kind, seed, label, coverUrl, language = "zh" }: CoverProps) {
  const alt = SECTION_COPY[language].coverAlt(label)

  return (
    <div className="art">
      {coverUrl ? <img src={coverUrl} alt={alt} /> : <GeneratedCover kind={kind} seed={seed} alt={alt} />}
    </div>
  )
}
