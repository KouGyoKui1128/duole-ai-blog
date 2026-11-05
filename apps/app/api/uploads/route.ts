import { issueSignedToken } from "@vercel/blob"
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import { isAuthorSession } from "@/lib/server-api"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_PATHNAME = /^(articles|projects)\/[\w-]+\.(jpg|jpeg|png|webp|gif)$/

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAuthorSession(request.headers.get("cookie")))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const result = await handleUploadPresigned({
      body: (await request.json()) as HandleUploadPresignedBody,
      request,
      getSignedToken: async (pathname) => {
        if (!IMAGE_PATHNAME.test(pathname)) throw new Error("不支持的图片路径")

        const limits = { allowedContentTypes: ALLOWED_CONTENT_TYPES, maximumSizeInBytes: MAX_IMAGE_BYTES }
        const token = await issueSignedToken({ pathname, operations: ["put"], ...limits })
        return { token, urlOptions: limits }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片上传失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
