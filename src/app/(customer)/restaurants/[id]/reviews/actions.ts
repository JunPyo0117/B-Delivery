"use server";

import { prisma } from "@/lib/prisma";

export interface ReviewItem {
  id: string;
  rating: number;
  content: string | null;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  user: {
    nickname: string;
    image: string | null;
  };
  orderMenuNames: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalCount: number;
  distribution: { rating: number; count: number }[];
}

export async function getReviewStats(
  restaurantId: string
): Promise<ReviewStats> {
  const [agg, reviews] = await Promise.all([
    prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { restaurantId },
      _count: { _all: true },
    }),
  ]);

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count:
      reviews.find((r) => r.rating === rating)?._count._all ?? 0,
  }));

  return {
    averageRating: agg._avg.rating ?? 0,
    totalCount: agg._count._all,
    distribution,
  };
}

export async function getReviews(
  restaurantId: string,
  options: {
    photoOnly?: boolean;
    cursor?: string;
    take?: number;
  } = {}
): Promise<{ reviews: ReviewItem[]; nextCursor: string | null }> {
  const { photoOnly = false, cursor, take = 20 } = options;

  const where: Record<string, unknown> = { restaurantId };

  // 사진 리뷰만 필터
  if (photoOnly) {
    where.imageUrls = { isEmpty: false };
  }

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { nickname: true, image: true } },
      order: {
        include: {
          items: {
            include: {
              menu: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const hasMore = reviews.length > take;
  const sliced = hasMore ? reviews.slice(0, take) : reviews;
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return {
    reviews: sliced.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      tags: r.tags,
      imageUrls: r.imageUrls,
      createdAt: r.createdAt.toISOString(),
      user: {
        nickname: r.user.nickname,
        image: r.user.image,
      },
      orderMenuNames: r.order.items.map((item) => item.menu.name),
    })),
    nextCursor,
  };
}
