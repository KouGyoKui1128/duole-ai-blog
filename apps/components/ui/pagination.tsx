import Link from "next/link"

interface PaginationProps {
  page: number
  totalPages: number
  createHref: (page: number) => string
  labels?: { label: string; previous: string; next: string }
}

const CHINESE_LABELS = { label: "分页", previous: "上一页", next: "下一页" }

export function Pagination({ page, totalPages, createHref, labels = CHINESE_LABELS }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label={labels.label} className="flex items-center justify-center gap-2 pt-6">
      <Link
        href={createHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-md border border-border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
      >
        {labels.previous}
      </Link>
      <div className="flex items-center gap-1">
        {pages.map((pageNumber) => (
          <Link
            key={pageNumber}
            href={createHref(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={`min-w-9 rounded-md border px-3 py-2 text-center text-sm ${pageNumber === page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
          >
            {pageNumber}
          </Link>
        ))}
      </div>
      <Link
        href={createHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-md border border-border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
      >
        {labels.next}
      </Link>
    </nav>
  )
}
