"use server"

import { prisma } from "@/lib/prisma"
import type { ReviewCardData, ReviewListResult, ReviewStats } from "../model/types"

const PAGE_SIZE = 50

interface GetReviewsParams {
  restaurantId: string
  photoOnly?: boolean
  cursor?: string
}

export async function getReviews({
  restaurantId,
  photoOnly = false,
  cursor,
}: GetReviewsParams): Promise<ReviewListResult> {
  // 리뷰 목록과 통계를 병렬 조회
  const [reviews, stats] = await Promise.all([
    fetchReviews(restaurantId, photoOnly, cursor),
    fetchReviewStats(restaurantId),
  ])

  return {
    reviews: reviews.data,
    stats,
    nextCursor: reviews.nextCursor,
  }
}

async function fetchReviews(
  restaurantId: string,
  photoOnly: boolean,
  cursor?: string
) {
  const whereClause = {
    restaurantId,
    ...(photoOnly
      ? { imageUrls: { isEmpty: false } }
      : {}),
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  }

  const reviews = await prisma.review.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          nickname: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  })

  const hasMore = reviews.length > PAGE_SIZE
  const sliced = hasMore ? reviews.slice(0, PAGE_SIZE) : reviews

  const data: ReviewCardData[] = sliced.map((review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    tags: review.tags,
    imageUrls: review.imageUrls,
    ownerReply: review.ownerReply,
    ownerRepliedAt: review.ownerRepliedAt,
    userName: review.user.nickname,
    userImage: review.user.image,
    createdAt: review.createdAt,
  }))

  return {
    data,
    nextCursor: hasMore
      ? sliced[sliced.length - 1].createdAt.toISOString()
      : null,
  }
}

async function fetchReviewStats(restaurantId: string): Promise<ReviewStats> {
  const reviews = await prisma.review.groupBy({
    by: ["rating"],
    where: { restaurantId },
    _count: { id: true },
  })

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  let totalCount = 0
  let totalRating = 0

  for (const row of reviews) {
    const rating = row.rating as 1 | 2 | 3 | 4 | 5
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = row._count.id
      totalCount += row._count.id
      totalRating += rating * row._count.id
    }
  }

  return {
    averageRating: totalCount > 0 ? totalRating / totalCount : 0,
    totalCount,
    distribution,
  }
}
