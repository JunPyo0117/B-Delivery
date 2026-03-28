"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

/** 리뷰 태그 목록 */
export const REVIEW_TAGS = [
  "맛이 좋아요",
  "양이 많아요",
  "배달이 빨라요",
  "포장이 깔끔해요",
  "가성비가 좋아요",
  "재주문 의사 있어요",
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

interface CreateReviewInput {
  orderId: string;
  rating: number;
  content?: string;
  tags: string[];
  imageUrls: string[];
}

interface CreateReviewResult {
  success: boolean;
  error?: string;
  reviewId?: string;
}

export async function createReview(
  input: CreateReviewInput
): Promise<CreateReviewResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const userId = session.user.id;

  // 별점 유효성 검사
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { success: false, error: "별점은 1~5 사이의 정수여야 합니다." };
  }

  // 태그 유효성 검사
  const validTags = input.tags.filter((tag) =>
    (REVIEW_TAGS as readonly string[]).includes(tag)
  );

  // 주문 존재 확인 + 소유자 확인 + DONE 상태 확인
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      userId: true,
      restaurantId: true,
      status: true,
    },
  });

  if (!order) {
    return { success: false, error: "주문을 찾을 수 없습니다." };
  }

  if (order.userId !== userId) {
    return { success: false, error: "본인의 주문에만 리뷰를 작성할 수 있습니다." };
  }

  if (order.status !== "DONE") {
    return {
      success: false,
      error: "배달 완료된 주문에만 리뷰를 작성할 수 있습니다.",
    };
  }

  // 중복 리뷰 방지 (orderId는 unique이므로 DB 레벨에서도 방지됨)
  const existingReview = await prisma.review.findUnique({
    where: { orderId: input.orderId },
  });

  if (existingReview) {
    return { success: false, error: "이미 리뷰를 작성한 주문입니다." };
  }

  // 리뷰 생성
  const review = await prisma.review.create({
    data: {
      userId,
      restaurantId: order.restaurantId,
      orderId: input.orderId,
      rating: input.rating,
      content: input.content?.trim() || null,
      tags: validTags,
      imageUrls: input.imageUrls,
    },
  });

  revalidatePath(`/restaurants/${order.restaurantId}`);
  revalidatePath(`/orders/${input.orderId}`);

  return { success: true, reviewId: review.id };
}
