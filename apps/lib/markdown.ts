import GithubSlugger from "github-slugger"
import { toString } from "mdast-util-to-string"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { visit } from "unist-util-visit"

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

// Ids must match what rehype-slug puts on the rendered headings, so every
// heading goes through the slugger, including the ones the outline leaves out.
export function extractHeadings(markdown: string): Heading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown)
  const slugger = new GithubSlugger()
  const headings: Heading[] = []

  visit(tree, "heading", (node) => {
    const text = toString(node)
    const id = slugger.slug(text)
    if (node.depth <= 3) headings.push({ id, text, level: node.depth === 3 ? 3 : 2 })
  })

  return headings
}
