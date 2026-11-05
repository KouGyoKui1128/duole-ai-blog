import { GeneratedCover } from "@/components/blog/generated-cover"
import type { CoverKind } from "@/lib/cover-art"

interface CoverProps {
  kind: CoverKind
  seed: string
  label: string
  coverUrl?: string | null
}

export function Cover({ kind, seed, label, coverUrl }: CoverProps) {
  return (
    <div className="art">
      {coverUrl ? <img src={coverUrl} alt={`${label}的封面图`} /> : <GeneratedCover kind={kind} seed={seed} label={label} />}
    </div>
  )
}
