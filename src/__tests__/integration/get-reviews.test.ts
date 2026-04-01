import { describe, it, expect } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { RESTAURANT } from "../helpers/fixtures";

describe("getReviews", () => {
  async function importGetReviews() {
    const { getReviews } = await import("@/entities/review/api/getReviews");
    return getReviews;
  }

  const mockReview = {
    id: "review-1",
    rating: 5,
    content: "맛있어요",
    tags: ["맛있어요"],
    imageUrls: ["img1.jpg"],
    ownerReply: null,
    ownerRepliedAt: null,
    createdAt: new Date("2026-03-30"),
    user: {
      nickname: "테스트유저",
      image: null,
    },
  };

  it("리뷰 목록 조회 성공: 리뷰와 통계를 함께 반환한다", async () => {
    const getReviews = await importGetReviews();

    prismaMock.review.findMany.mockResolvedValue([mockReview] as any);
    (prismaMock.review.groupBy as any).mockResolvedValue([
      { rating: 5, _count: { id: 3 } },
      { rating: 4, _count: { id: 2 } },
    ]);

    const result = await getReviews({ restaurantId: RESTAURANT.id });

    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0]).toEqual({
      id: "review-1",
      rating: 5,
      content: "맛있어요",
      tags: ["맛있어요"],
      imageUrls: ["img1.jpg"],
      ownerReply: null,
      ownerRepliedAt: null,
      userName: "테스트유저",
      userImage: null,
      createdAt: new Date("2026-03-30"),
    });
    expect(result.stats.totalCount).toBe(5);
    expect(result.stats.averageRating).toBeCloseTo((5 * 3 + 4 * 2) / 5);
    expect(result.stats.distribution[5]).toBe(3);
    expect(result.stats.distribution[4]).toBe(2);
    expect(result.stats.distribution[1]).toBe(0);
  });

  it("빈 리뷰: 리뷰가 없으면 빈 배열과 0 통계를 반환한다", async () => {
    const getReviews = await importGetReviews();

    prismaMock.review.findMany.mockResolvedValue([]);
    (prismaMock.review.groupBy as any).mockResolvedValue([]);

    const result = await getReviews({ restaurantId: RESTAURANT.id });

    expect(result.reviews).toEqual([]);
    expect(result.stats.totalCount).toBe(0);
    expect(result.stats.averageRating).toBe(0);
    expect(result.nextCursor).toBeNull();
  });

  it("페이지네이션: 51개 이상이면 nextCursor가 설정된다", async () => {
    const getReviews = await importGetReviews();

    // 51개의 리뷰 생성 (PAGE_SIZE + 1)
    const reviews = Array.from({ length: 51 }, (_, i) => ({
      ...mockReview,
      id: `review-${i}`,
      createdAt: new Date(`2026-03-${String(30 - (i % 28)).padStart(2, "0")}`),
    }));

    prismaMock.review.findMany.mockResolvedValue(reviews as any);
    (prismaMock.review.groupBy as any).mockResolvedValue([]);

    const result = await getReviews({ restaurantId: RESTAURANT.id });

    expect(result.reviews).toHaveLength(50);
    expect(result.nextCursor).not.toBeNull();
  });

  it("photoOnly 필터: 사진만 보기 모드에서 findMany에 조건이 포함된다", async () => {
    const getReviews = await importGetReviews();

    prismaMock.review.findMany.mockResolvedValue([]);
    (prismaMock.review.groupBy as any).mockResolvedValue([]);

    await getReviews({ restaurantId: RESTAURANT.id, photoOnly: true });

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          restaurantId: RESTAURANT.id,
          imageUrls: { isEmpty: false },
        }),
      })
    );
  });

  it("커서 기반 페이지네이션: cursor가 있으면 createdAt lt 조건이 추가된다", async () => {
    const getReviews = await importGetReviews();

    prismaMock.review.findMany.mockResolvedValue([]);
    (prismaMock.review.groupBy as any).mockResolvedValue([]);

    const cursorDate = "2026-03-25T00:00:00.000Z";
    await getReviews({ restaurantId: RESTAURANT.id, cursor: cursorDate });

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date(cursorDate) },
        }),
      })
    );
  });
});
