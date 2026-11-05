'use client'

import { showToast } from "@/components/site/toast"

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast(successMessage)
  } catch {
    showToast("当前环境不能写入剪贴板，请手动选择文字复制")
  }
}

export function CopyEmailButton({ email }: { email: string }) {
  return (
    <button className="btn solid" type="button" onClick={() => copyText(email, "邮箱已复制")}>
      复制邮箱
    </button>
  )
}

export function CopyCodeButton() {
  const copyCode = (event: React.MouseEvent<HTMLButtonElement>) => {
    const code = event.currentTarget.closest("figure")?.querySelector("code")
    if (code) copyText(code.textContent ?? "", "代码已复制")
  }

  return (
    <button className="copy" type="button" aria-label="复制代码" onClick={copyCode}>
      复制
    </button>
  )
}
