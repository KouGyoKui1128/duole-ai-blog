import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { isAuthorSession } from "@/lib/server-api"

// Called after the Author changes content, so published and unpublished
// articles show the change on the next visit instead of after the cache expires.
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAuthorSession(request.headers.get("cookie")))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ revalidated: true })
}
