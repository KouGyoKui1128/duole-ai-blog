import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderKanban, Tags, Eye } from "lucide-react"
import { articles, projects, tags } from "@/lib/mock-data"

const stats = [
  { label: "文章", value: articles.length, icon: FileText, color: "text-blue-600" },
  { label: "项目", value: projects.length, icon: FolderKanban, color: "text-green-600" },
  { label: "标签", value: tags.length, icon: Tags, color: "text-purple-600" },
  { label: "总阅读", value: "1,234", icon: Eye, color: "text-orange-600" },
]

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className={"h-4 w-4 " + stat.color} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">阅读</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {articles.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{a.title}</span>
                  <span className="text-muted-foreground text-xs ml-2">{a.publishedAt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">阅读</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {articles.slice(0, 3).map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.readTime} 阅读</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
