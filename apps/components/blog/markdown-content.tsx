import { isValidElement, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { CopyCodeButton } from "@/components/site/copy-button"
import type { ArticleLanguage } from "@/lib/article-language"

function codeLanguage(children: React.ReactNode): string {
  if (!isValidElement<{ className?: string }>(children)) return "text"
  return children.props.className?.match(/language-([\w-]+)/)?.[1] ?? "text"
}

function ScrollableTable(props: ComponentProps<"table">) {
  return (
    <div className="tablebox">
      <table {...props} />
    </div>
  )
}

// The page title is the only h1, so a # heading in the body renders as h2.
function SectionHeading(props: ComponentProps<"h1">) {
  return <h2 {...props} />
}

export function MarkdownContent({ content, language = "zh" }: { content: string; language?: ArticleLanguage }) {
  const CodeBlock = ({ children }: ComponentProps<"pre">) => (
    <figure className="codebox">
      <figcaption className="codebar">
        <span>{codeLanguage(children)}</span>
        <CopyCodeButton language={language} />
      </figcaption>
      <pre tabIndex={0}>{children}</pre>
    </figure>
  )

  return (
    <article className="prose" id="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{ h1: SectionHeading, pre: CodeBlock, table: ScrollableTable }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
