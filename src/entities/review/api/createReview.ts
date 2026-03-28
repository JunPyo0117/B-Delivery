"use server"

import { prisma } from "@/shared/api/prisma"
import type { ReviewFormData } from "../model/types"

interface CreateReviewResult {
  success: boolean
  reviewId?: string
  error?: string
}

export async function createReview(
  userId: string,
  data: ReviewFormData
): Promise<CreateReviewResult> {
  const { orderId, restaurantId, rating, content, tags, imageUrls } = data

  // 1. 별점 범위 검증
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "별점은 1~5 사이 정수여야 합니다." }
  }

  // 2. 주문 존재 및 본인 주문 확인
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      restaurantId,
      status: "DONE",
    },
    select: { id: true },
  })

  if (!order) {
    return {
      success: false,
      error: "리뷰를 작성할 수 있는 주문이 아닙니다. 배달 완료된 주문만 리뷰 가능합니다.",
    }
  }

  // 3. 중복 리뷰 방지
  const existingReview = await prisma.review.findUnique({
    where: { orderId },
    select: { id: true },
  })

  if (existingReview) {
    return {
      success: false,
      error: "이미 이 주문에 대한 리뷰를 작성하셨습니다.",
    }
  }

  // 4. 자기 가게 리뷰 방지
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  })

  if (!restaurant) {
    return { success: false, error: "존재하지 않는 음식점입니다." }
  }

  if (restaurant.ownerId === userId) {
    return {
      success: false,
      error: "자신의 가게에는 리뷰를 작성할 수 없습니다.",
    }
  }

  // 5. 이미지 개수 제한
  if (imageUrls.length > 3) {
    return {
      success: false,
      error: "리뷰 이미지는 최대 3장까지 첨부할 수 있습니다.",
    }
  }

  // 6. 리뷰 생성
  const review = await prisma.review.create({
    data: {
      userId,
      restaurantId,
      orderId,
      rating,
      content: content?.trim() || null,
      tags,
      imageUrls,
    },
  })

  return { success: true, reviewId: review.id }
}
