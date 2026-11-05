import Link from "next/link"

import { Cover } from "@/components/blog/cover"
import type { Project } from "@/lib/content"
import { projectCoverKind } from "@/lib/cover-art"

export function ProjectCard({ project, stackLimit }: { project: Project; stackLimit?: number }) {
  return (
    <Link className="work" href={`/projects/${project.slug}`}>
      <Cover kind={projectCoverKind(project.slug)} seed={project.slug} label={project.title} coverUrl={project.cover_url} />
      <h3 className="serif">{project.title}</h3>
      <p>{project.summary}</p>
      <span className="stack">{project.tech_stack.slice(0, stackLimit).join(" · ")}</span>
    </Link>
  )
}
