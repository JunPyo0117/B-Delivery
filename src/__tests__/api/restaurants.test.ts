/**
 * GET /api/restaurants 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { createMockSession } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { redisMock } from "../helpers/redis-mock";
import { GET } from "@/app/api/restaurants/route";
import { NextRequest } from "next/server";

function makeRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost/api/restaurants");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

function makeSessionWithLocation(lat: number | null = 37.5665, lng: number | null = 126.978) {
  return {
    user: {
      id: "user-1",
      role: "USER" as const,
      email: "test@example.com",
      nickname: "테스트",
      defaultAddress: "서울",
      latitude: lat,
      longitude: lng,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

describe("GET /api/restaurants", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // ── 위치 미설정 ──
  it("위치 미설정 시 400 반환", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation(null, null) as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("주소");
  });

  // ── 유효하지 않은 카테고리 ──
  it("유효하지 않은 카테고리 → 400", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    const res = await GET(makeRequest({ category: "INVALID_CAT" }));
    expect(res.status).toBe(400);
  });

  // ── Redis 캐시 히트 ──
  it("Redis 캐시가 있으면 캐시된 데이터 반환", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    const cachedData = JSON.stringify({
      restaurants: [{ id: "r-1", name: "캐시식당" }],
      nextCursor: null,
    });
    redisMock.get.mockResolvedValue(cachedData);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(json.restaurants[0].name).toBe("캐시식당");
    expect(prismaMock.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  // ── DB 조회 ──
  it("캐시 미스 시 DB에서 조회 후 캐시 저장", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    redisMock.get.mockResolvedValue(null);

    const dbResult = [
      { id: "r-1", name: "식당1", category: "KOREAN", distance: 1.5, avgRating: 4.5, reviewCount: 10 },
    ];
    prismaMock.$queryRawUnsafe.mockResolvedValue(dbResult as never);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(json.restaurants).toHaveLength(1);
    expect(json.restaurants[0].name).toBe("식당1");
    expect(json.nextCursor).toBeNull();
    expect(redisMock.set).toHaveBeenCalled();
  });

  // ── 페이지네이션 ──
  it("결과가 limit+1개이면 hasMore → nextCursor 반환", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    redisMock.get.mockResolvedValue(null);

    // limit 기본값 20 → 21개 반환
    const dbResult = Array.from({ length: 21 }, (_, i) => ({
      id: `r-${i}`,
      name: `식당${i}`,
    }));
    prismaMock.$queryRawUnsafe.mockResolvedValue(dbResult as never);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(json.restaurants).toHaveLength(20);
    expect(json.nextCursor).toBe(20);
  });

  // ── 카테고리 필터 ──
  it("ALL 카테고리는 필터 미적용", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    redisMock.get.mockResolvedValue(null);
    prismaMock.$queryRawUnsafe.mockResolvedValue([] as never);

    await GET(makeRequest({ category: "ALL" }));

    // $queryRawUnsafe의 인자가 5개 (카테고리 미포함)
    const callArgs = prismaMock.$queryRawUnsafe.mock.calls[0];
    expect(callArgs).toHaveLength(6); // query + 5 params (no category param)
  });

  it("특정 카테고리 필터 적용 시 파라미터 추가", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    redisMock.get.mockResolvedValue(null);
    prismaMock.$queryRawUnsafe.mockResolvedValue([] as never);

    await GET(makeRequest({ category: "KOREAN" }));

    const callArgs = prismaMock.$queryRawUnsafe.mock.calls[0];
    expect(callArgs).toHaveLength(7); // query + 6 params (includes category)
    expect(callArgs[6]).toBe("KOREAN");
  });

  // ── Redis 실패 시 폴백 ──
  it("Redis get 실패 시 DB로 폴백", async () => {
    vi.mocked(auth).mockResolvedValue(makeSessionWithLocation() as never);
    redisMock.get.mockRejectedValue(new Error("Redis down"));
    prismaMock.$queryRawUnsafe.mockResolvedValue([] as never);
    redisMock.set.mockRejectedValue(new Error("Redis down"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });
});
