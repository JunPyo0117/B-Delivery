import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getMinioClient,
  MINIO_BUCKET,
  getPublicUrl,
  toPublicPresignedUrl,
} from "@/lib/minio";
import type { ImageCategory, PresignedUrlResponse } from "@/types/upload";

const ALLOWED_CATEGORIES: ImageCategory[] = [
  "profile",
  "restaurant",
  "menu",
  "review",
  "chat",
];

const ALLOWED_CONTENT_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PRESIGNED_URL_EXPIRY = 60 * 5; // 5분

export async function POST(request: NextRequest) {
  try {
    // TODO: 인증 확인 (NextAuth 세션 검증 - auth 태스크 완료 후 연결)

    const body = await request.json();
    const { category, contentType, fileSize } = body;

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `허용되지 않는 카테고리입니다: ${category}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다. (webp, jpeg, png, gif)" },
        { status: 400 }
      );
    }

    if (typeof fileSize !== "number" || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const extension =
      contentType === "image/webp" ? "webp" : contentType.split("/")[1];
    const objectKey = `${category}/${randomUUID()}.${extension}`;

    const rawUrl = await getMinioClient().presignedPutObject(
      MINIO_BUCKET,
      objectKey,
      PRESIGNED_URL_EXPIRY
    );

    const response: PresignedUrlResponse = {
      uploadUrl: toPublicPresignedUrl(rawUrl),
      objectKey,
      publicUrl: getPublicUrl(objectKey),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Presigned URL] Error:", error);
    return NextResponse.json(
      { error: "Presigned URL 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
