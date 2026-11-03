'use client'

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getApplications, reviewApplication, type UserApplicationItem } from "@/lib/admin-api"

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<UserApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchApplications = () =>
    getApplications()
      .then((data) => {
        setApplications(data)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "加载申请失败"
        setError(message)
      })
      .finally(() => {
        setLoading(false)
      })

  const loadApplications = async () => {
    setLoading(true)
    setError("")
    await fetchApplications()
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleReview = async (application: UserApplicationItem, status: "approved" | "rejected") => {
    try {
      await reviewApplication(application.id, {
        status,
        review_note: status === "approved" ? "已通过" : "已拒绝",
      })
      await loadApplications()
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新申请状态失败"
      setError(message)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">加入申请管理</h1>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">正在加载申请...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂时没有新的申请</p>
      ) : null}

      <div className="space-y-3">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{application.username}</p>
                  <Badge variant="outline">{application.requested_role}</Badge>
                  <Badge variant={application.status === "approved" ? "default" : application.status === "rejected" ? "destructive" : "secondary"}>
                    {application.status_label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{application.email}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{application.motivation}</p>
                {application.status === "approved" && application.initial_password ? (
                  <p className="text-xs text-muted-foreground">初始密码: {application.initial_password}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleReview(application, "approved")} disabled={application.status !== "pending"}>
                  通过并创建账号
                </Button>
                <Button variant="destructive" onClick={() => handleReview(application, "rejected")} disabled={application.status !== "pending"}>
                  拒绝
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}