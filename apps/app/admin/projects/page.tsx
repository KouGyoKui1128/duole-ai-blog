import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { projects } from "@/lib/mock-data"
import { Plus, Edit } from "lucide-react"
import Link from "next/link"

export default function AdminProjectsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">????</h1>
        <Button><Plus className="h-4 w-4 mr-1" />????</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.techStack.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Edit className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
