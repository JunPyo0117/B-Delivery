import { describe, it, expect } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";

describe("updateReview", () => {
  async function importUpdateReview() {
    const { updateReview } = await import(
      "@/entities/review/api/updateReview"
    );
    return updateReview;
  }

  it("수정 성공: 본인 리뷰의 별점과 내용을 수정한다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);
    prismaMock.review.update.mockResolvedValue({} as any);

    const result = await updateReview("user-1", "review-1", {
      rating: 4,
      content: "수정된 리뷰",
    });

    expect(result).toEqual({ success: true });
    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: { rating: 4, content: "수정된 리뷰" },
    });
  });

  it("리뷰 없음: 존재하지 않는 리뷰는 실패한다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue(null);

    const result = await updateReview("user-1", "nonexistent", { rating: 3 });

    expect(result).toEqual({
      success: false,
      error: "리뷰를 찾을 수 없습니다.",
    });
  });

  it("권한 없음: 다른 사용자의 리뷰는 수정할 수 없다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "other-user",
    } as any);

    const result = await updateReview("user-1", "review-1", { rating: 3 });

    expect(result).toEqual({
      success: false,
      error: "본인의 리뷰만 수정할 수 있습니다.",
    });
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("별점 검증: 범위 밖의 별점은 실패한다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);

    const result = await updateReview("user-1", "review-1", { rating: 6 });

    expect(result).toEqual({
      success: false,
      error: "별점은 1~5 사이 정수여야 합니다.",
    });
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("별점 검증: 소수점 별점은 실패한다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);

    const result = await updateReview("user-1", "review-1", { rating: 2.5 });

    expect(result).toEqual({
      success: false,
      error: "별점은 1~5 사이 정수여야 합니다.",
    });
  });

  it("이미지 개수 제한: 4장 이상은 실패한다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);

    const result = await updateReview("user-1", "review-1", {
      imageUrls: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"],
    });

    expect(result).toEqual({
      success: false,
      error: "리뷰 이미지는 최대 3장까지 첨부할 수 있습니다.",
    });
  });

  it("content trim: 공백만 있는 content는 null로 저장된다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);
    prismaMock.review.update.mockResolvedValue({} as any);

    await updateReview("user-1", "review-1", { content: "   " });

    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: { content: null },
    });
  });

  it("부분 업데이트: rating만 전달하면 rating만 업데이트된다", async () => {
    const updateReview = await importUpdateReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);
    prismaMock.review.update.mockResolvedValue({} as any);

    await updateReview("user-1", "review-1", { rating: 3 });

    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: { rating: 3 },
    });
  });
});
