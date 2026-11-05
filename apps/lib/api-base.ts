const DEFAULT_SERVER_API_BASE = "http://127.0.0.1:8000/api/v1"

// The browser only ever talks to this site. next.config.ts forwards /api/v1 to
// the backend, which keeps the login cookie first-party.
export const CLIENT_API_BASE = "/api/v1"

export function getServerApiBase(): string {
  const value = (process.env.SERVER_API_BASE || "").trim()
  return (value || DEFAULT_SERVER_API_BASE).replace(/\/$/, "")
}
