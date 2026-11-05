'use client'

export default function ErrorPage({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <main className="flex-1">
      <div className="wrap empty">
        <h1 className="serif">页面暂时打不开</h1>
        <p>服务可能正在唤醒，请等一分钟后重试。</p>
        <button className="btn solid" type="button" onClick={() => unstable_retry()}>重试</button>
      </div>
    </main>
  )
}
