const DEFAULT_API_BASE = "http://127.0.0.1:8000/api/v1"

function normalizeApiBase(raw: string | undefined): string {
  const value = (raw || "").trim()
  if (!value) return DEFAULT_API_BASE
  return value.replace(/\/$/, "")
}

function getBrowserHostApiBase(): string | undefined {
  if (typeof window === "undefined") return undefined
  const host = window.location.hostname
  if (!host) return undefined
  if (host === "localhost" || host === "127.0.0.1") {
    return `http://${host}:8000/api/v1`
  }
  return undefined
}

export function getClientApiBase(): string {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE || getBrowserHostApiBase())
}

export function getServerApiBase(): string {
  return normalizeApiBase(process.env.SERVER_API_BASE || process.env.NEXT_PUBLIC_API_BASE)
}
