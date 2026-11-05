import { connection } from "next/server"

import { getServerApiBase } from "@/lib/api-base"

// The free backend sleeps when idle. Serving public pages from the data cache
// means a visitor gets the last good copy while the backend wakes up.
const PUBLIC_REVALIDATE_SECONDS = 60

export async function fetchPublic(path: string): Promise<Response> {
  // Render at request time so that builds never depend on the backend being awake.
  await connection()
  return fetch(`${getServerApiBase()}${path}`, { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } })
}
