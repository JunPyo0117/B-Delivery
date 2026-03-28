"use server"

import { prisma } from "@/lib/prisma"

interface UpdateReviewInput {
  rating?: number
  content?: string
  tags?: string[]
  imageUrls?: string[]
}

interface UpdateReviewResult {
  success: boolean
  error?: string
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: UpdateReviewInput
): Promise<UpdateReviewResult> {
  // 1. 리뷰 존재 및 본인 확인
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })

  if (!review) {
    return { success: false, error: "리뷰를 찾을 수 없습니다." }
  }

  if (review.userId !== userId) {
    return { success: false, error: "본인의 리뷰만 수정할 수 있습니다." }
  }

  // 2. 별점 검증
  if (
    data.rating !== undefined &&
    (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
  ) {
    return { success: false, error: "별점은 1~5 사이 정수여야 합니다." }
  }

  // 3. 이미지 개수 제한
  if (data.imageUrls && data.imageUrls.length > 3) {
    return {
      success: false,
      error: "리뷰 이미지는 최대 3장까지 첨부할 수 있습니다.",
    }
  }

  // 4. 리뷰 업데이트
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.content !== undefined && {
        content: data.content.trim() || null,
      }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
    },
  })

  return { success: true }
}
