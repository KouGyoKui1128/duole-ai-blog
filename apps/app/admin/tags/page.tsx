import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tags } from "@/lib/mock-data"
import { Plus, Trash2 } from "lucide-react"

export default function AdminTagsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">标签管理</h1>
        <Button><Plus className="h-4 w-4 mr-1" />新建标签</Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.slug} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-xs text-muted-foreground">/{tag.slug}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
