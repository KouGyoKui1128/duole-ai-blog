/** Markdown toolbar edits as pure text transforms, so the editor only has to apply the result. */

export type MarkdownFormat =
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "strike"
  | "quote"
  | "code"
  | "codeblock"
  | "link"
  | "ol"
  | "ul"

export interface Edit {
  text: string
  selectionStart: number
  selectionEnd: number
}

const INLINE: Partial<Record<MarkdownFormat, { marker: string; sample: string }>> = {
  bold: { marker: "**", sample: "加粗文字" },
  italic: { marker: "*", sample: "斜体文字" },
  strike: { marker: "~~", sample: "删除线文字" },
  code: { marker: "`", sample: "code" },
}

const LINE: Partial<Record<MarkdownFormat, { prefix: (index: number) => string; sample: string }>> = {
  h2: { prefix: () => "## ", sample: "二级标题" },
  h3: { prefix: () => "### ", sample: "三级标题" },
  quote: { prefix: () => "> ", sample: "引用内容" },
  ol: { prefix: (index) => `${index + 1}. `, sample: "列表项" },
  ul: { prefix: () => "- ", sample: "列表项" },
}

// Any existing heading, quote or list marker, so switching H2 to a list replaces it instead of stacking.
const LINE_PREFIX = /^(#{1,6} |> |\d+\. |[-*+] )/

function replaceRange(text: string, start: number, end: number, insert: string) {
  return text.slice(0, start) + insert + text.slice(end)
}

function wrapInline(edit: Edit, marker: string, sample: string): Edit {
  const { text, selectionStart: start, selectionEnd: end } = edit
  const inner = start === end ? sample : text.slice(start, end)
  return {
    text: replaceRange(text, start, end, `${marker}${inner}${marker}`),
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + inner.length,
  }
}

function link(edit: Edit): Edit {
  const { text, selectionStart: start, selectionEnd: end } = edit
  if (start === end) {
    const label = "链接文字"
    return {
      text: replaceRange(text, start, end, `[${label}](https://)`),
      selectionStart: start + 1,
      selectionEnd: start + 1 + label.length,
    }
  }
  const label = text.slice(start, end)
  const url = "https://"
  const urlStart = start + label.length + 3
  return {
    text: replaceRange(text, start, end, `[${label}](${url})`),
    selectionStart: urlStart,
    selectionEnd: urlStart + url.length,
  }
}

function codeBlock(edit: Edit): Edit {
  const { text, selectionStart: start, selectionEnd: end } = edit
  const inner = start === end ? "代码" : text.slice(start, end)
  const before = start > 0 && text[start - 1] !== "\n" ? "\n" : ""
  const after = end < text.length && text[end] !== "\n" ? "\n" : ""
  const open = `${before}\`\`\`\n`
  return {
    text: replaceRange(text, start, end, `${open}${inner}\n\`\`\`${after}`),
    selectionStart: start + open.length,
    selectionEnd: start + open.length + inner.length,
  }
}

function lineFormat(edit: Edit, prefix: (index: number) => string, sample: string): Edit {
  const { text, selectionStart: start, selectionEnd: end } = edit
  const lineStart = text.lastIndexOf("\n", start - 1) + 1
  // A selection ending right after a newline does not reach into the next line.
  const lastChar = end > start && text[end - 1] === "\n" ? end - 1 : end
  const nextBreak = text.indexOf("\n", lastChar)
  const lineEnd = nextBreak === -1 ? text.length : nextBreak
  const lines = text.slice(lineStart, lineEnd).split("\n")

  if (lines.length === 1 && lines[0].trim() === "") {
    const head = prefix(0)
    return {
      text: replaceRange(text, lineStart, lineEnd, `${head}${sample}`),
      selectionStart: lineStart + head.length,
      selectionEnd: lineStart + head.length + sample.length,
    }
  }

  // Clicking the same button again on lines that already have it removes it.
  const alreadyApplied = lines.every((line, index) => line.startsWith(prefix(index)))
  const formatted = lines
    .map((line, index) => {
      const bare = line.replace(LINE_PREFIX, "")
      return alreadyApplied || bare.trim() === "" ? bare : `${prefix(index)}${bare}`
    })
    .join("\n")

  return {
    text: replaceRange(text, lineStart, lineEnd, formatted),
    selectionStart: lineStart,
    selectionEnd: lineStart + formatted.length,
  }
}

export function applyMarkdownFormat(edit: Edit, format: MarkdownFormat): Edit {
  const inline = INLINE[format]
  if (inline) return wrapInline(edit, inline.marker, inline.sample)
  const line = LINE[format]
  if (line) return lineFormat(edit, line.prefix, line.sample)
  if (format === "link") return link(edit)
  return codeBlock(edit)
}
