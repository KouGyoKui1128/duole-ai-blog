import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import { isAuthorSession } from "@/lib/server-api"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAuthorSession(request.headers.get("cookie")))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const result = await handleUpload({
      body: (await request.json()) as HandleUploadBody,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_IMAGE_BYTES,
        addRandomSuffix: true,
      }),
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片上传失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
