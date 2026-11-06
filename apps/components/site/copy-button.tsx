'use client'

import { showToast } from "@/components/site/toast"
import { SECTION_COPY, type ArticleLanguage } from "@/lib/article-language"

async function copyText(text: string, successMessage: string, failureMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast(successMessage)
  } catch {
    showToast(failureMessage)
  }
}

export function CopyEmailButton({ email }: { email: string }) {
  return (
    <button className="btn solid" type="button" onClick={() => copyText(email, "邮箱已复制", SECTION_COPY.zh.copyFailed)}>
      复制邮箱
    </button>
  )
}

export function CopyCodeButton({ language }: { language: ArticleLanguage }) {
  const copy = SECTION_COPY[language]

  const copyCode = (event: React.MouseEvent<HTMLButtonElement>) => {
    const code = event.currentTarget.closest("figure")?.querySelector("code")
    if (code) copyText(code.textContent ?? "", copy.codeCopied, copy.copyFailed)
  }

  return (
    <button className="copy" type="button" aria-label={copy.copyCode} onClick={copyCode}>
      {copy.copy}
    </button>
  )
}
