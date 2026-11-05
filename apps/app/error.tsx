'use client'

import { Button } from "@/components/ui/button"

export default function ErrorPage({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">页面暂时打不开</h1>
      <p className="text-sm text-muted-foreground">服务可能正在唤醒，请等一分钟后重试。</p>
      <Button onClick={() => unstable_retry()}>重试</Button>
    </main>
  )
}
