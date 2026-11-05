import type { Metadata } from "next"
import Link from "next/link"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { CopyEmailButton } from "@/components/site/copy-button"
import { getResume } from "@/lib/content"

export const metadata: Metadata = { title: "简历" }

function externalHref(address: string): string {
  return /^https?:\/\//.test(address) ? address : `https://${address}`
}

export default async function ResumePage() {
  const resume = await getResume()

  return (
    <>
      <Header />
      <main className="flex-1">
        {resume ? (
          <div className="page wrap split">
            <div className="card-id">
              <span className="label">{resume.title}</span>
              <h1 className="serif">{resume.name}</h1>
              <p>{resume.bio}</p>
              {resume.email ? <div className="mail"><span>{resume.email}</span></div> : null}
              <div className="cta">
                {resume.email ? <CopyEmailButton email={resume.email} /> : null}
                <Link className="btn" href="/projects">看项目</Link>
              </div>
              <div className="links">
                {resume.github ? <a className="more" href={externalHref(resume.github)} target="_blank" rel="noopener noreferrer">GitHub</a> : null}
                {resume.website ? <a className="more" href={externalHref(resume.website)} target="_blank" rel="noopener noreferrer">个人网站</a> : null}
              </div>
            </div>

            <div className="cv">
              {resume.experience.length > 0 ? (
                <section>
                  <h2>工作经历</h2>
                  {resume.experience.map((item) => (
                    <div className="entry" key={`${item.company}-${item.period}`}>
                      <time>{item.period}</time>
                      <div>
                        <h3>{item.role}</h3>
                        <p className="org">{item.company}</p>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}

              {resume.skills.length > 0 ? (
                <section>
                  <h2>技能</h2>
                  <div className="skills">
                    {resume.skills.map((group) => (
                      <div key={group.category}>
                        <h3>{group.category}</h3>
                        <p>{group.items.join(" · ")}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {resume.education.length > 0 ? (
                <section>
                  <h2>教育背景</h2>
                  {resume.education.map((item) => (
                    <div className="entry" key={`${item.school}-${item.period}`}>
                      <time>{item.period}</time>
                      <div>
                        <h3>{item.degree}</h3>
                        <p className="org">{item.school}</p>
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="page wrap empty">
            <h1 className="serif">简历还在整理中</h1>
            <p>可以先看看我的项目和文章。</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
