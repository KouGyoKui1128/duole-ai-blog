'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { articles } from "@/lib/mock-data"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditArticlePage() {
  const params = useParams()
  const article = articles.find((a) => a.id === params.id)
  const [title, setTitle] = useState(article?.title || "")
  const router = useRouter()

  if (!article) return <div className="p-6">?????</div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">????</h1>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <Input defaultValue={article.summary} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">??</label>
          <Textarea className="min-h-[400px] font-mono text-sm" defaultValue={article.content} />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={() => router.push("/admin/articles")}>??</Button>
          <Link href="/admin/articles"><Button variant="ghost">??</Button></Link>
        </div>
      </div>
    </div>
  )
}
