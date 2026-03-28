"use server"

import { prisma } from "@/lib/prisma"

interface DeleteReviewResult {
  success: boolean
  error?: string
}

export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<DeleteReviewResult> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })

  if (!review) {
    return { success: false, error: "리뷰를 찾을 수 없습니다." }
  }

  if (review.userId !== userId) {
    return { success: false, error: "본인의 리뷰만 삭제할 수 있습니다." }
  }

  await prisma.review.delete({
    where: { id: reviewId },
  })

  return { success: true }
}
