import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { searchRestaurants } from "@/features/search/api/searchRestaurants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchRestaurants", () => {
  it("빈 쿼리: 빈 배열을 반환한다", async () => {
    const result = await searchRestaurants({
      query: "",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result).toEqual([]);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it("공백만 있는 쿼리: 빈 배열을 반환한다", async () => {
    const result = await searchRestaurants({
      query: "   ",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result).toEqual([]);
  });

  it("검색 결과가 없으면 빈 배열을 반환한다", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([] as any);

    const result = await searchRestaurants({
      query: "존재하지않는가게",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result).toEqual([]);
  });

  it("검색 결과를 올바르게 매핑한다 (매칭 메뉴 포함)", async () => {
    // 첫 번째 $queryRaw: 음식점 검색
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: "rest-1",
        name: "테스트 치킨집",
        category: "CHICKEN",
        imageUrl: null,
        deliveryTime: 30,
        deliveryFee: 3000,
        minOrderAmount: 12000,
        distance: 1.56789,
        avg_rating: 4.23456,
        review_count: 15,
      },
    ] as any);

    // 두 번째 $queryRaw: 매칭 메뉴
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        restaurantId: "rest-1",
        menuId: "menu-1",
        menuName: "후라이드 치킨",
        menuPrice: 18000,
        menuCategory: "치킨",
      },
    ] as any);

    const result = await searchRestaurants({
      query: "치킨",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "rest-1",
      name: "테스트 치킨집",
      category: "CHICKEN",
      imageUrl: null,
      rating: 4.2,
      reviewCount: 15,
      deliveryTime: 30,
      deliveryFee: 3000,
      minOrderAmount: 12000,
      distance: 1.6,
      matchedMenus: [
        {
          menuId: "menu-1",
          menuName: "후라이드 치킨",
          menuPrice: 18000,
          menuCategory: "치킨",
        },
      ],
    });
  });

  it("매칭 메뉴가 없는 음식점은 빈 배열로 반환한다", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: "rest-1",
        name: "김밥천국",
        category: "KOREAN",
        imageUrl: null,
        deliveryTime: 20,
        deliveryFee: 2000,
        minOrderAmount: 8000,
        distance: 0.5,
        avg_rating: 3.5,
        review_count: 30,
      },
    ] as any);

    // 매칭 메뉴 없음
    prismaMock.$queryRaw.mockResolvedValueOnce([] as any);

    const result = await searchRestaurants({
      query: "김밥",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result[0].matchedMenus).toEqual([]);
  });

  it("여러 음식점과 매칭 메뉴를 올바르게 그룹핑한다", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: "rest-1",
        name: "가게A",
        category: "KOREAN",
        imageUrl: null,
        deliveryTime: 25,
        deliveryFee: 2000,
        minOrderAmount: 10000,
        distance: 1.0,
        avg_rating: 4.0,
        review_count: 10,
      },
      {
        id: "rest-2",
        name: "가게B",
        category: "JAPANESE",
        imageUrl: null,
        deliveryTime: 35,
        deliveryFee: 3000,
        minOrderAmount: 15000,
        distance: 2.0,
        avg_rating: 4.5,
        review_count: 20,
      },
    ] as any);

    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        restaurantId: "rest-1",
        menuId: "m1",
        menuName: "메뉴A-1",
        menuPrice: 9000,
        menuCategory: "밥류",
      },
      {
        restaurantId: "rest-1",
        menuId: "m2",
        menuName: "메뉴A-2",
        menuPrice: 11000,
        menuCategory: "밥류",
      },
      {
        restaurantId: "rest-2",
        menuId: "m3",
        menuName: "메뉴B-1",
        menuPrice: 15000,
        menuCategory: "초밥",
      },
    ] as any);

    const result = await searchRestaurants({
      query: "밥",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result).toHaveLength(2);
    expect(result[0].matchedMenus).toHaveLength(2);
    expect(result[1].matchedMenus).toHaveLength(1);
  });

  it("rating과 distance를 소수점 1자리로 반올림한다", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: "rest-1",
        name: "가게",
        category: "KOREAN",
        imageUrl: null,
        deliveryTime: 30,
        deliveryFee: 3000,
        minOrderAmount: 12000,
        distance: 2.75,
        avg_rating: 3.85,
        review_count: 5,
      },
    ] as any);
    prismaMock.$queryRaw.mockResolvedValueOnce([] as any);

    const result = await searchRestaurants({
      query: "가게",
      lat: 37.5665,
      lng: 126.978,
    });

    expect(result[0].rating).toBe(3.9); // Math.round(3.85 * 10) / 10
    expect(result[0].distance).toBe(2.8); // Math.round(2.75 * 10) / 10
  });
});
