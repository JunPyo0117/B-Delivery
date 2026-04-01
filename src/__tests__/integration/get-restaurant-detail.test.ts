import { describe, it, expect } from "vitest"
import { getRestaurantDetail } from "@/entities/restaurant/api/getRestaurantDetail"
import { prismaMock } from "../helpers/prisma-mock"

const MOCK_RESTAURANT = {
  id: "restaurant-1",
  name: "테스트 음식점",
  category: "KOREAN",
  imageUrl: null,
  deliveryTime: 30,
  deliveryFee: 3000,
  minOrderAmount: 12000,
  address: "서울시 강남구",
  description: "맛있는 한식",
  notice: null,
  isOpen: true,
  openTime: "09:00",
  closeTime: "22:00",
  latitude: 37.5665,
  longitude: 126.978,
  ownerId: "owner-1",
  menus: [
    {
      id: "menu-1",
      name: "김치찌개",
      price: 9000,
      description: "얼큰한 김치찌개",
      imageUrl: null,
      category: "찌개",
      isSoldOut: false,
      isPopular: true,
      isNew: false,
      optionGroups: [
        {
          id: "og-1",
          name: "맵기 선택",
          isRequired: true,
          maxSelect: 1,
          sortOrder: 1,
          options: [
            { id: "opt-1", name: "순한맛", extraPrice: 0, sortOrder: 1 },
            { id: "opt-2", name: "매운맛", extraPrice: 0, sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: "menu-2",
      name: "된장찌개",
      price: 8000,
      description: null,
      imageUrl: null,
      category: "찌개",
      isSoldOut: true,
      isPopular: false,
      isNew: true,
      optionGroups: [],
    },
    {
      id: "menu-3",
      name: "비빔밥",
      price: 10000,
      description: null,
      imageUrl: null,
      category: "밥",
      isSoldOut: false,
      isPopular: false,
      isNew: false,
      optionGroups: [],
    },
  ],
  reviews: [{ rating: 4 }, { rating: 5 }, { rating: 3 }],
}

describe("getRestaurantDetail", () => {
  it("음식점 상세 조회 성공", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1")

    expect(result).not.toBeNull()
    expect(result!.restaurant.id).toBe("restaurant-1")
    expect(result!.restaurant.name).toBe("테스트 음식점")
    expect(result!.restaurant.isOpen).toBe(true)
  })

  it("존재하지 않는 음식점 — null 반환", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(null)

    const result = await getRestaurantDetail("non-existent")

    expect(result).toBeNull()
  })

  it("리뷰 평균 평점 계산", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1")

    // (4 + 5 + 3) / 3 = 4.0
    expect(result!.restaurant.rating).toBe(4)
    expect(result!.restaurant.reviewCount).toBe(3)
  })

  it("리뷰 없는 음식점 — rating 0, reviewCount 0", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...MOCK_RESTAURANT,
      reviews: [],
    } as any)

    const result = await getRestaurantDetail("restaurant-1")

    expect(result!.restaurant.rating).toBe(0)
    expect(result!.restaurant.reviewCount).toBe(0)
  })

  it("메뉴 카테고리별 그룹핑", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1")

    expect(result!.menuGroups).toHaveLength(2) // 찌개, 밥
    const jjigaeGroup = result!.menuGroups.find((g) => g.category === "찌개")
    expect(jjigaeGroup!.items).toHaveLength(2)
    const bapGroup = result!.menuGroups.find((g) => g.category === "밥")
    expect(bapGroup!.items).toHaveLength(1)
  })

  it("메뉴 옵션 그룹 포함", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1")

    const jjigaeGroup = result!.menuGroups.find((g) => g.category === "찌개")!
    const kimchi = jjigaeGroup.items.find((i) => i.name === "김치찌개")!
    expect(kimchi.optionGroups).toHaveLength(1)
    expect(kimchi.optionGroups[0].name).toBe("맵기 선택")
    expect(kimchi.optionGroups[0].options).toHaveLength(2)
  })

  it("사용자 위치 제공 시 거리 계산", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1", 37.5665, 126.978)

    expect(result!.restaurant.distance).toBeDefined()
    expect(result!.restaurant.distance).toBe(0) // 같은 좌표
  })

  it("사용자 위치 미제공 시 거리 undefined", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(MOCK_RESTAURANT as any)

    const result = await getRestaurantDetail("restaurant-1")

    expect(result!.restaurant.distance).toBeUndefined()
  })

  it("메뉴 없는 음식점 — 빈 menuGroups", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...MOCK_RESTAURANT,
      menus: [],
    } as any)

    const result = await getRestaurantDetail("restaurant-1")

    expect(result!.menuGroups).toHaveLength(0)
  })
})
