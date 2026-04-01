import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { getFavorites } from "@/features/favorite/api/getFavorites";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFavorites", () => {
  it("비인증 사용자: 에러를 던진다", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null));

    await expect(
      getFavorites({ lat: 37.5665, lng: 126.978 })
    ).rejects.toThrow("로그인이 필요합니다.");
  });

  it("찜 목록을 올바르게 매핑하여 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    prismaMock.$queryRaw.mockResolvedValue([
      {
        id: "rest-1",
        name: "테스트 음식점",
        category: "KOREAN",
        imageUrl: null,
        deliveryTime: 30,
        deliveryFee: 3000,
        minOrderAmount: 12000,
        distance: 1.23456,
        avg_rating: 4.56789,
        review_count: 42,
      },
    ] as any);

    const result = await getFavorites({ lat: 37.5665, lng: 126.978 });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "rest-1",
      name: "테스트 음식점",
      category: "KOREAN",
      imageUrl: null,
      rating: 4.6, // Math.round(4.56789 * 10) / 10
      reviewCount: 42,
      deliveryTime: 30,
      deliveryFee: 3000,
      minOrderAmount: 12000,
      distance: 1.2, // Math.round(1.23456 * 10) / 10
    });
  });

  it("빈 찜 목록이면 빈 배열을 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    prismaMock.$queryRaw.mockResolvedValue([] as any);

    const result = await getFavorites({ lat: 37.5665, lng: 126.978 });

    expect(result).toEqual([]);
  });

  it("리뷰가 없는 음식점은 rating 0, reviewCount 0으로 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    prismaMock.$queryRaw.mockResolvedValue([
      {
        id: "rest-2",
        name: "새 음식점",
        category: "CHINESE",
        imageUrl: "https://img.example.com/food.jpg",
        deliveryTime: 45,
        deliveryFee: 2000,
        minOrderAmount: 10000,
        distance: 0.54321,
        avg_rating: 0,
        review_count: 0,
      },
    ] as any);

    const result = await getFavorites({ lat: 37.5665, lng: 126.978 });

    expect(result[0].rating).toBe(0);
    expect(result[0].reviewCount).toBe(0);
  });

  it("여러 음식점을 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    prismaMock.$queryRaw.mockResolvedValue([
      {
        id: "rest-1",
        name: "가게1",
        category: "KOREAN",
        imageUrl: null,
        deliveryTime: 30,
        deliveryFee: 3000,
        minOrderAmount: 12000,
        distance: 1.0,
        avg_rating: 4.5,
        review_count: 10,
      },
      {
        id: "rest-2",
        name: "가게2",
        category: "JAPANESE",
        imageUrl: null,
        deliveryTime: 40,
        deliveryFee: 2000,
        minOrderAmount: 15000,
        distance: 2.0,
        avg_rating: 3.8,
        review_count: 5,
      },
    ] as any);

    const result = await getFavorites({ lat: 37.5665, lng: 126.978 });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("가게1");
    expect(result[1].name).toBe("가게2");
  });
});
