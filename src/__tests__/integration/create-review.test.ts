import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { RESTAURANT } from "../helpers/fixtures";

describe("createReview", () => {
  async function importCreateReview() {
    const { createReview } = await import(
      "@/entities/review/api/createReview"
    );
    return createReview;
  }

  const validData = {
    orderId: "order-1",
    restaurantId: RESTAURANT.id,
    rating: 5,
    content: "맛있어요!",
    tags: ["맛있어요"],
    imageUrls: ["img1.jpg"],
  };

  it("리뷰 생성 성공: 유효한 데이터로 리뷰가 생성된다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ownerId: "other-owner",
    } as any);
    prismaMock.review.create.mockResolvedValue({
      id: "review-1",
    } as any);

    const result = await createReview("user-1", validData);

    expect(result).toEqual({ success: true, reviewId: "review-1" });
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        restaurantId: RESTAURANT.id,
        orderId: "order-1",
        rating: 5,
        content: "맛있어요!",
        tags: ["맛있어요"],
        imageUrls: ["img1.jpg"],
      },
    });
  });

  it("별점 범위 검증: 0점은 실패한다", async () => {
    const createReview = await importCreateReview();

    const result = await createReview("user-1", { ...validData, rating: 0 });

    expect(result).toEqual({
      success: false,
      error: "별점은 1~5 사이 정수여야 합니다.",
    });
  });

  it("별점 범위 검증: 6점은 실패한다", async () => {
    const createReview = await importCreateReview();

    const result = await createReview("user-1", { ...validData, rating: 6 });

    expect(result).toEqual({
      success: false,
      error: "별점은 1~5 사이 정수여야 합니다.",
    });
  });

  it("별점 범위 검증: 소수점은 실패한다", async () => {
    const createReview = await importCreateReview();

    const result = await createReview("user-1", {
      ...validData,
      rating: 3.5,
    });

    expect(result).toEqual({
      success: false,
      error: "별점은 1~5 사이 정수여야 합니다.",
    });
  });

  it("주문 없음: 배달 완료되지 않은 주문은 리뷰 작성 불가", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue(null);

    const result = await createReview("user-1", validData);

    expect(result).toEqual({
      success: false,
      error:
        "리뷰를 작성할 수 있는 주문이 아닙니다. 배달 완료된 주문만 리뷰 가능합니다.",
    });
  });

  it("중복 리뷰 방지: 이미 리뷰가 존재하면 실패한다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue({
      id: "existing-review",
    } as any);

    const result = await createReview("user-1", validData);

    expect(result).toEqual({
      success: false,
      error: "이미 이 주문에 대한 리뷰를 작성하셨습니다.",
    });
  });

  it("존재하지 않는 음식점: 음식점을 찾을 수 없으면 실패한다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue(null);

    const result = await createReview("user-1", validData);

    expect(result).toEqual({
      success: false,
      error: "존재하지 않는 음식점입니다.",
    });
  });

  it("자기 가게 리뷰 방지: 사장이 자기 가게에 리뷰를 작성하면 실패한다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ownerId: "user-1",
    } as any);

    const result = await createReview("user-1", validData);

    expect(result).toEqual({
      success: false,
      error: "자신의 가게에는 리뷰를 작성할 수 없습니다.",
    });
  });

  it("이미지 개수 제한: 4장 이상 첨부하면 실패한다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ownerId: "other-owner",
    } as any);

    const result = await createReview("user-1", {
      ...validData,
      imageUrls: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"],
    });

    expect(result).toEqual({
      success: false,
      error: "리뷰 이미지는 최대 3장까지 첨부할 수 있습니다.",
    });
  });

  it("content trim: 공백만 있는 content는 null로 저장된다", async () => {
    const createReview = await importCreateReview();

    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as any);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ownerId: "other-owner",
    } as any);
    prismaMock.review.create.mockResolvedValue({ id: "review-2" } as any);

    await createReview("user-1", { ...validData, content: "   " });

    expect(prismaMock.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: null }),
      })
    );
  });
});
