import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";
import { RESTAURANT, MENU_ITEM } from "../helpers/fixtures";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// createOrder를 mock하여 placeOrder의 위임 로직만 검증
vi.mock("@/entities/order/api/createOrder", () => ({
  createOrder: vi.fn(),
}));

import { auth } from "@/auth";
import { placeOrder } from "@/features/cart/api/placeOrder";
import { createOrder } from "@/entities/order/api/createOrder";

const BASE_INPUT = {
  restaurantId: RESTAURANT.id,
  deliveryAddress: "서울시 강남구",
  deliveryLat: 37.4979,
  deliveryLng: 127.0276,
  items: [
    {
      menuId: MENU_ITEM.id,
      quantity: 2,
      price: MENU_ITEM.price,
      optionPrice: 0,
      selectedOptions: [],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("placeOrder", () => {
  it("비인증 사용자: 로그인 없으면 에러를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await placeOrder(BASE_INPUT);

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("인증된 사용자: createOrder에 올바른 인자를 전달한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    vi.mocked(createOrder).mockResolvedValue({
      success: true,
      orderId: "order-123",
    });

    const result = await placeOrder(BASE_INPUT);

    expect(result).toEqual({ success: true, orderId: "order-123" });
    expect(createOrder).toHaveBeenCalledWith("user-1", {
      restaurantId: RESTAURANT.id,
      deliveryAddress: "서울시 강남구",
      deliveryLat: 37.4979,
      deliveryLng: 127.0276,
      deliveryNote: undefined,
      items: [
        {
          menuId: MENU_ITEM.id,
          quantity: 2,
          price: MENU_ITEM.price,
          optionPrice: 0,
          selectedOptions: [],
        },
      ],
    });
  });

  it("deliveryNote가 있으면 createOrder에 전달된다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    vi.mocked(createOrder).mockResolvedValue({
      success: true,
      orderId: "order-456",
    });

    const inputWithNote = {
      ...BASE_INPUT,
      deliveryNote: "문 앞에 놓아주세요",
    };

    await placeOrder(inputWithNote);

    expect(vi.mocked(createOrder).mock.calls[0][1].deliveryNote).toBe(
      "문 앞에 놓아주세요"
    );
  });

  it("createOrder 실패를 그대로 전달한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    vi.mocked(createOrder).mockResolvedValue({
      success: false,
      error: "존재하지 않는 음식점입니다.",
    });

    const result = await placeOrder(BASE_INPUT);

    expect(result.success).toBe(false);
    expect(result.error).toContain("존재하지 않는 음식점");
  });

  it("옵션이 포함된 아이템을 올바르게 매핑한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    vi.mocked(createOrder).mockResolvedValue({
      success: true,
      orderId: "order-789",
    });

    const inputWithOptions = {
      ...BASE_INPUT,
      items: [
        {
          menuId: "menu-1",
          quantity: 1,
          price: 9000,
          optionPrice: 2000,
          selectedOptions: [
            { groupName: "사이즈", optionName: "라지", extraPrice: 2000 },
          ],
        },
      ],
    };

    await placeOrder(inputWithOptions);

    const passedItems = vi.mocked(createOrder).mock.calls[0][1].items;
    expect(passedItems[0].optionPrice).toBe(2000);
    expect(passedItems[0].selectedOptions).toEqual([
      { groupName: "사이즈", optionName: "라지", extraPrice: 2000 },
    ]);
  });

  it("session.user.id가 undefined이면 에러를 반환한다", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: undefined },
      expires: new Date().toISOString(),
    } as any);

    const result = await placeOrder(BASE_INPUT);

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
  });
});
