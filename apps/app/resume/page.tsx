import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { resumeData } from "@/lib/mock-data"
import { Mail, Globe } from "lucide-react"

export default function ResumePage() {
  const r = resumeData
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-2xl">{r.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{r.name}</h1>
            <p className="text-lg text-muted-foreground mb-2">{r.title}</p>
            <p className="text-sm text-muted-foreground max-w-lg">{r.bio}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
              <span className="flex items-center gap-1"><svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>{r.github}</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{r.website}</span>
            </div>
          </div>
        </div>
        <Separator className="mb-8" />

        {/* Skills */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">教育</h2>
          <div className="space-y-3">
            {r.skills.map((skillGroup) => (
              <div key={skillGroup.category}>
                <p className="text-sm font-medium text-muted-foreground mb-1.5">{skillGroup.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillGroup.items.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">教育教育</h2>
          <div className="space-y-6">
            {r.experience.map((exp, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-border">
                <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">{exp.period}</p>
                <h3 className="font-semibold">{exp.role}</h3>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
                <p className="text-sm mt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="text-xl font-bold mb-4">教育</h2>
          <div className="space-y-4">
            {r.education.map((edu, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-border">
                <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">{edu.period}</p>
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-sm text-muted-foreground">{edu.school}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
