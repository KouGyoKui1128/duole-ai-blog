'use client'

import { useEffect, useState } from "react"

const TOAST_EVENT = "duole-toast"
const TOAST_MS = 1900

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }))
}

export function Toast() {
  const [message, setMessage] = useState("")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer = 0
    const onToast = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail)
      setVisible(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(false), TOAST_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className={visible ? "toast on" : "toast"} role="status" aria-live="polite">
      {message}
    </div>
  )
}
