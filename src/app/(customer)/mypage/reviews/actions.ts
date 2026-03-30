"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

interface UpdateReviewInput {
  reviewId: string;
  rating: number;
  content?: string;
  tags: string[];
}

export async function updateReview(
  input: UpdateReviewInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    return { error: "별점은 1~5 사이의 정수여야 합니다." };
  }

  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
  });

  if (!review || review.userId !== session.user.id) {
    return { error: "리뷰를 찾을 수 없습니다." };
  }

  await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      rating: input.rating,
      content: input.content?.trim() || null,
      tags: input.tags,
    },
  });

  revalidatePath("/mypage/reviews");
  revalidatePath(`/restaurants/${review.restaurantId}`);

  return { success: true };
}

export async function deleteReview(
  reviewId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.userId !== session.user.id) {
    return { error: "리뷰를 찾을 수 없습니다." };
  }

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath("/mypage/reviews");
  revalidatePath(`/restaurants/${review.restaurantId}`);

  return { success: true };
}
