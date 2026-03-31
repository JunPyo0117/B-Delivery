"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

// ── 타입 ────────────────────────────────────────────────

export interface OwnerReviewItem {
  id: string;
  rating: number;
  content: string | null;
  tags: string[];
  imageUrls: string[];
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  user: {
    nickname: string;
    image: string | null;
  };
  orderMenuNames: string[];
}

export interface OwnerReviewStats {
  averageRating: number;
  totalCount: number;
  unrepliedCount: number;
}

// ── 소유권 확인 헬퍼 ─────────────────────────────────────

async function verifyOwnership(reviewId: string, userId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      restaurant: { select: { ownerId: true } },
    },
  });

  if (!review) {
    return { error: "리뷰를 찾을 수 없습니다.", review: null };
  }

  if (review.restaurant.ownerId !== userId) {
    return { error: "해당 리뷰에 대한 권한이 없습니다.", review: null };
  }

  return { error: null, review };
}

// ── 리뷰 목록 조회 ─────────────────────────────────────

export async function getOwnerReviews(
  restaurantId: string
): Promise<OwnerReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
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

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    tags: r.tags,
    imageUrls: r.imageUrls,
    ownerReply: r.ownerReply,
    ownerRepliedAt: r.ownerRepliedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    user: {
      nickname: r.user.nickname,
      image: r.user.image,
    },
    orderMenuNames: r.order.items.map((item) => item.menu.name),
  }));
}

// ── 통계 조회 ───────────────────────────────────────────

export async function getOwnerReviewStats(
  restaurantId: string
): Promise<OwnerReviewStats> {
  const [agg, unreplied] = await Promise.all([
    prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.count({
      where: { restaurantId, ownerReply: null },
    }),
  ]);

  return {
    averageRating: agg._avg.rating ?? 0,
    totalCount: agg._count._all,
    unrepliedCount: unreplied,
  };
}

// ── 사장 답글 작성 ──────────────────────────────────────

export async function createOwnerReply(
  reviewId: string,
  content: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "답글 내용을 입력해주세요." };
  }

  const { error } = await verifyOwnership(reviewId, session.user.id);
  if (error) return { error };

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerReply: trimmed,
      ownerRepliedAt: new Date(),
    },
  });

  revalidatePath("/owner/reviews");
  return { success: true };
}

// ── 사장 답글 수정 ──────────────────────────────────────

export async function updateOwnerReply(
  reviewId: string,
  content: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "답글 내용을 입력해주세요." };
  }

  const { error } = await verifyOwnership(reviewId, session.user.id);
  if (error) return { error };

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerReply: trimmed,
      ownerRepliedAt: new Date(),
    },
  });

  revalidatePath("/owner/reviews");
  return { success: true };
}

// ── 사장 답글 삭제 ──────────────────────────────────────

export async function deleteOwnerReply(
  reviewId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await verifyOwnership(reviewId, session.user.id);
  if (error) return { error };

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerReply: null,
      ownerRepliedAt: null,
    },
  });

  revalidatePath("/owner/reviews");
  return { success: true };
}
