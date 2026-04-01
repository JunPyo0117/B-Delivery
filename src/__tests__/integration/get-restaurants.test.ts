import { describe, it, expect } from "vitest"
import { getRestaurants } from "@/entities/restaurant/api/getRestaurants"
import { prismaMock } from "../helpers/prisma-mock"
import { redisMock } from "../helpers/redis-mock"

const MOCK_ROW = {
  id: "restaurant-1",
  name: "테스트 음식점",
  category: "KOREAN",
  imageUrl: null,
  deliveryTime: 30,
  deliveryFee: 3000,
  minOrderAmount: 12000,
  distance: 1.5,
  avg_rating: 4.5,
  review_count: 10,
}

describe("getRestaurants", () => {
  it("음식점 목록 조회 성공", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([MOCK_ROW] as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(1)
    expect(result.restaurants[0].id).toBe("restaurant-1")
    expect(result.restaurants[0].rating).toBe(4.5)
    expect(result.restaurants[0].distance).toBe(1.5)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it("캐시 히트 — DB 조회 없이 캐시 반환", async () => {
    const cached = {
      restaurants: [{ ...MOCK_ROW, rating: 4.5, reviewCount: 10, distance: 1.5 }],
      nextCursor: null,
      hasMore: false,
    }
    redisMock.get.mockResolvedValue(JSON.stringify(cached))

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result).toEqual(cached)
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
  })

  it("Redis 에러 시 DB fallback", async () => {
    redisMock.get.mockRejectedValue(new Error("Redis down"))
    prismaMock.$queryRaw.mockResolvedValue([MOCK_ROW] as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(1)
  })

  it("페이지네이션 — 21건 시 hasMore true", async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      ...MOCK_ROW,
      id: `restaurant-${i}`,
    }))
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue(rows as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(20)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe("restaurant-19")
  })

  it("20건 이하 — hasMore false", async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      ...MOCK_ROW,
      id: `restaurant-${i}`,
    }))
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue(rows as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(20)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it("빈 결과", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([] as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(0)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it("rating 소수점 반올림 (4.56 → 4.6)", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([
      { ...MOCK_ROW, avg_rating: 4.56 },
    ] as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants[0].rating).toBe(4.6)
  })

  it("distance 소수점 반올림 (1.45 → 1.5)", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([
      { ...MOCK_ROW, distance: 1.45 },
    ] as any)

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants[0].distance).toBe(1.5)
  })

  it("결과 캐싱 — setex 호출 확인", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([MOCK_ROW] as any)

    await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(redisMock.setex).toHaveBeenCalledWith(
      expect.stringContaining("restaurants:"),
      300,
      expect.any(String)
    )
  })

  it("캐시 저장 실패해도 결과 반환", async () => {
    redisMock.get.mockResolvedValue(null)
    prismaMock.$queryRaw.mockResolvedValue([MOCK_ROW] as any)
    redisMock.setex.mockRejectedValue(new Error("Redis write fail"))

    const result = await getRestaurants({
      lat: 37.5665,
      lng: 126.978,
    })

    expect(result.restaurants).toHaveLength(1)
  })
})
