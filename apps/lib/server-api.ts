import { getServerApiBase } from "@/lib/api-base"

export async function isAuthorSession(cookie: string | null): Promise<boolean> {
  if (!cookie) return false

  const res = await fetch(`${getServerApiBase()}/auth/me`, { headers: { cookie }, cache: "no-store" })
  if (!res.ok) return false

  const json = await res.json()
  return json.data?.role === "admin"
}
