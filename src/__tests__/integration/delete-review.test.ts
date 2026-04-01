import { describe, it, expect } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";

describe("deleteReview", () => {
  async function importDeleteReview() {
    const { deleteReview } = await import(
      "@/entities/review/api/deleteReview"
    );
    return deleteReview;
  }

  it("삭제 성공: 본인 리뷰를 삭제한다", async () => {
    const deleteReview = await importDeleteReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "user-1",
    } as any);
    prismaMock.review.delete.mockResolvedValue({} as any);

    const result = await deleteReview("user-1", "review-1");

    expect(result).toEqual({ success: true });
    expect(prismaMock.review.delete).toHaveBeenCalledWith({
      where: { id: "review-1" },
    });
  });

  it("리뷰 없음: 존재하지 않는 리뷰는 실패한다", async () => {
    const deleteReview = await importDeleteReview();

    prismaMock.review.findUnique.mockResolvedValue(null);

    const result = await deleteReview("user-1", "nonexistent");

    expect(result).toEqual({
      success: false,
      error: "리뷰를 찾을 수 없습니다.",
    });
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });

  it("권한 없음: 다른 사용자의 리뷰는 삭제할 수 없다", async () => {
    const deleteReview = await importDeleteReview();

    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      userId: "other-user",
    } as any);

    const result = await deleteReview("user-1", "review-1");

    expect(result).toEqual({
      success: false,
      error: "본인의 리뷰만 삭제할 수 있습니다.",
    });
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });
});
