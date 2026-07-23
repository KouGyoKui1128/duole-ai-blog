'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tags } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewArticlePage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const router = useRouter()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">????</h1>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <Input placeholder="??????" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <Input placeholder="????" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.slug} variant="outline" className="cursor-pointer">{tag.name}</Badge>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">?? (Markdown)</label>
          <Textarea className="min-h-[400px] font-mono text-sm" placeholder="???? Markdown ??..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={() => router.push("/admin/articles")}>??</Button>
          <Button variant="outline">????</Button>
          <Link href="/admin/articles"><Button variant="ghost">??</Button></Link>
        </div>
      </div>
    </div>
  )
}
