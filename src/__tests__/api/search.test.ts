/**
 * GET /api/search 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { GET } from "@/app/api/search/route";
import { NextRequest } from "next/server";

function makeRequest(q?: string) {
  const url = new URL("http://localhost/api/search");
  if (q !== undefined) url.searchParams.set("q", q);
  return new NextRequest(url);
}

describe("GET /api/search", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(makeRequest("치킨"));
    expect(res.status).toBe(401);
  });

  // ── 빈 검색어 ──
  it("검색어 미제공 시 빈 결과 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  it("공백 검색어 시 빈 결과 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await GET(makeRequest("   "));
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  // ── 음식점 이름 매칭 ──
  it("음식점 이름 매칭 결과 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.menu.findMany.mockResolvedValue([]);
    prismaMock.restaurant.findMany.mockResolvedValue([
      {
        id: "r-1",
        name: "맛있는치킨",
        imageUrl: "http://img.jpg",
        reviews: [{ rating: 5 }, { rating: 4 }],
      },
    ] as never);

    const res = await GET(makeRequest("치킨"));
    const json = await res.json();

    expect(json.results).toHaveLength(1);
    expect(json.results[0].restaurantName).toBe("맛있는치킨");
    expect(json.results[0].matchedMenuName).toBeNull();
    expect(json.results[0].avgRating).toBe(4.5);
    expect(json.results[0].reviewCount).toBe(2);
  });

  // ── 메뉴 이름 매칭 ──
  it("메뉴 이름 매칭 결과 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.restaurant.findMany.mockResolvedValue([]);
    prismaMock.menu.findMany.mockResolvedValue([
      {
        name: "양념치킨",
        price: 18000,
        restaurant: {
          id: "r-2",
          name: "BBQ",
          imageUrl: null,
          reviews: [{ rating: 3 }],
        },
      },
    ] as never);

    const res = await GET(makeRequest("양념"));
    const json = await res.json();

    expect(json.results).toHaveLength(1);
    expect(json.results[0].matchedMenuName).toBe("양념치킨");
    expect(json.results[0].price).toBe(18000);
    expect(json.results[0].avgRating).toBe(3);
  });

  // ── 중복 제거 ──
  it("동일 음식점이 중복되지 않음", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.restaurant.findMany.mockResolvedValue([
      {
        id: "r-1",
        name: "치킨집",
        imageUrl: null,
        reviews: [],
      },
    ] as never);
    prismaMock.menu.findMany.mockResolvedValue([
      {
        name: "후라이드",
        price: 16000,
        restaurant: { id: "r-1", name: "치킨집", imageUrl: null, reviews: [] },
      },
    ] as never);

    const res = await GET(makeRequest("치킨"));
    const json = await res.json();

    // 음식점 이름 매칭(r-1:__restaurant__) + 메뉴 매칭(r-1:후라이드) = 2건
    expect(json.results).toHaveLength(2);
  });

  // ── 리뷰 없는 음식점 ──
  it("리뷰 없으면 avgRating=0, reviewCount=0", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.menu.findMany.mockResolvedValue([]);
    prismaMock.restaurant.findMany.mockResolvedValue([
      { id: "r-3", name: "새식당", imageUrl: null, reviews: [] },
    ] as never);

    const res = await GET(makeRequest("새식당"));
    const json = await res.json();

    expect(json.results[0].avgRating).toBe(0);
    expect(json.results[0].reviewCount).toBe(0);
  });
});
