import { Input } from "@/components/ui/input"

// Same rule as the backend's SLUG_PATTERN.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A blank slug is fine: the backend makes one up on create and keeps the old one on update. */
export function slugError(slug: string): string {
  const value = slug.trim()
  if (!value || SLUG_PATTERN.test(value)) return ""
  return "格式不对：只能用小写英文、数字和连字符，连字符不能在开头、结尾或连续出现"
}

export function SlugField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const error = slugError(value)
  return (
    <div>
      <label className="text-sm font-medium mb-1 block" htmlFor="article-slug">Slug</label>
      <Input
        id="article-slug"
        placeholder="例如 feishu-personal-assistant，留空则自动生成"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby="article-slug-help"
      />
      <p id="article-slug-help" className="text-xs text-muted-foreground mt-1">
        会出现在文章网址里，只能用小写英文、数字和连字符，发布后尽量不要改
      </p>
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
    </div>
  )
}
