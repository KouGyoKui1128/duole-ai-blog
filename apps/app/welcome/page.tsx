import Link from "next/link"
import { Archive, BookOpen, FolderKanban, Orbit } from "lucide-react"

export default function WelcomePage() {
  return (
    <main className="archive-entry-page">
      <div className="entry-scanline" aria-hidden="true" />
      <div className="entry-grid" aria-hidden="true" />
      <div className="archive-starfield" aria-hidden="true" />
      <section className="archive-entry-shell" aria-labelledby="entry-title">
        <div className="archive-entry-rail archive-entry-rail-left" aria-hidden="true"><span>ARCHIVE 01</span><span>ARCHIVE 02</span><span>ARCHIVE 03</span></div>
        <div className="archive-entry-content">
          <div className="archive-entry-kicker"><Orbit className="h-4 w-4" /> DUOLE DIGITAL ARCHIVE / NODE 07</div>
          <div className="archive-entry-orb"><Archive className="h-9 w-9" /></div>
          <p className="entry-code">A CURATED MEMORY SYSTEM FOR AI BUILDERS</p>
          <h1 id="entry-title">DuoLe AI Blog</h1>
          <p className="archive-entry-description">一座记录 LangChain、LangGraph 与 AI Agent 的数字资料库。选择一个舱门，开始探索。</p>
          <div className="archive-entry-doors">
            <Link href="/blog" className="archive-entry-door"><BookOpen className="h-6 w-6" /><span>博客资料舱</span><small>KNOWLEDGE / ARTICLES</small></Link>
            <Link href="/projects" className="archive-entry-door archive-entry-door-amber"><FolderKanban className="h-6 w-6" /><span>项目资料舱</span><small>WORKS / EXPERIMENTS</small></Link>
          </div>
          <p className="entry-footer-note">资料库在线 · 访客可自由读取公开节点</p>
        </div>
      </section>
    </main>
  )
}
