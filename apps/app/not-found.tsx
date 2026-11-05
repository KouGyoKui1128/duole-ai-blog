import Link from "next/link"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ArrowIcon } from "@/components/site/arrow-icon"

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="page wrap empty">
          <span className="label">404</span>
          <h1 className="serif">这一页不存在</h1>
          <p>它可能已经移走，或者地址写错了。</p>
          <div className="cta">
            <Link className="btn solid" href="/">回到首页 <ArrowIcon /></Link>
            <Link className="btn" href="/blog">看文章</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
