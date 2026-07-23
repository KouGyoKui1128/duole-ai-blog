import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { articles } from "@/lib/mock-data"
import Link from "next/link"
import { Plus, Edit, Eye } from "lucide-react"

export default function AdminArticlesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">????</h1>
        <Link href="/admin/articles/new">
          <Button><Plus className="h-4 w-4 mr-1" />????</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{article.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{article.publishedAt}</span>
                  <span>?</span>
                  <span>{article.readTime} ??</span>
                  <div className="flex gap-1 ml-1">
                    {article.tags.map((t) => <Badge key={t.slug} variant="secondary" className="text-[10px] px-1.5 py-0">{t.name}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 shrink-0">
                <Link href={"/blog/" + article.slug} target="_blank">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                </Link>
                <Link href={"/admin/articles/" + article.id}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
