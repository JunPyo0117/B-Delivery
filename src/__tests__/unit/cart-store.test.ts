import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/features/cart/model/cartStore";
import type { CartItemOption } from "@/features/cart/model/cartStore";

/** 테스트용 기본 메뉴 아이템 팩토리 */
function makeItem(overrides?: Partial<{
  menuId: string;
  name: string;
  price: number;
  options: CartItemOption[];
  imageUrl: string | null;
  restaurantId: string;
  restaurantName: string;
}>) {
  return {
    menuId: "menu-1",
    name: "후라이드 치킨",
    price: 18000,
    options: [],
    imageUrl: null,
    restaurantId: "rest-1",
    restaurantName: "맛있는 치킨집",
    ...overrides,
  };
}

const OPTION_A: CartItemOption = {
  groupId: "size",
  groupName: "사이즈",
  optionId: "large",
  optionName: "라지",
  extraPrice: 2000,
};

const OPTION_B: CartItemOption = {
  groupId: "sauce",
  groupName: "소스",
  optionId: "hot",
  optionName: "핫소스",
  extraPrice: 500,
};

beforeEach(() => {
  useCartStore.setState({
    items: [],
    restaurantId: null,
    restaurantName: null,
    deliveryFee: 0,
    minOrderAmount: 0,
  });
});

describe("addItem", () => {
  it("빈 장바구니에 메뉴를 추가한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 1);

    const { items, restaurantId } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("후라이드 치킨");
    expect(items[0].quantity).toBe(1);
    expect(restaurantId).toBe("rest-1");
  });

  it("같은 메뉴+옵션이면 수량을 증가시킨다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: [OPTION_A] }), 1);
    addItem(makeItem({ options: [OPTION_A] }), 2);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("여러 아이템 중 일치하는 것만 수량이 증가하고 나머지는 그대로 유지된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ menuId: "menu-1", options: [OPTION_A] }), 1);
    addItem(makeItem({ menuId: "menu-2", name: "양념치킨", options: [OPTION_B] }), 2);

    // menu-1만 추가 → menu-1 수량 증가, menu-2는 그대로
    addItem(makeItem({ menuId: "menu-1", options: [OPTION_A] }), 3);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.menuId === "menu-1")!.quantity).toBe(4);
    expect(items.find((i) => i.menuId === "menu-2")!.quantity).toBe(2);
  });

  it("같은 메뉴라도 옵션이 다르면 별도 항목으로 추가된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: [OPTION_A] }), 1);
    addItem(makeItem({ options: [OPTION_B] }), 1);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });

  it("옵션 없는 메뉴를 추가한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: [] }), 2);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].options).toEqual([]);
    expect(items[0].quantity).toBe(2);
  });
});

describe("removeItem", () => {
  it("특정 아이템을 제거한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ menuId: "menu-1" }), 1);
    addItem(makeItem({ menuId: "menu-2", name: "양념치킨" }), 1);

    const { items, removeItem } = useCartStore.getState();
    const keyToRemove = items[0].cartItemKey;
    removeItem(keyToRemove);

    const updated = useCartStore.getState().items;
    expect(updated).toHaveLength(1);
    expect(updated[0].menuId).toBe("menu-2");
  });

  it("마지막 아이템 제거 시 장바구니가 초기화된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 1);

    const { items, removeItem } = useCartStore.getState();
    removeItem(items[0].cartItemKey);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.restaurantId).toBeNull();
    expect(state.restaurantName).toBeNull();
    expect(state.deliveryFee).toBe(0);
    expect(state.minOrderAmount).toBe(0);
  });
});

describe("updateQuantity", () => {
  it("아이템의 수량을 변경한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 1);

    const { items, updateQuantity } = useCartStore.getState();
    updateQuantity(items[0].cartItemKey, 5);

    const updated = useCartStore.getState().items;
    expect(updated[0].quantity).toBe(5);
  });

  it("수량이 0 이하이면 아이템을 제거한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 2);

    const { items, updateQuantity } = useCartStore.getState();
    updateQuantity(items[0].cartItemKey, 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("getTotal / getTotalQuantity", () => {
  it("옵션 추가 가격을 포함한 총액을 계산한다", () => {
    const { addItem } = useCartStore.getState();
    // 18000 + 2000(OPTION_A) + 500(OPTION_B) = 20500, 수량 2 → 41000
    addItem(makeItem({ options: [OPTION_A, OPTION_B] }), 2);
    // 15000, 옵션 없음, 수량 1 → 15000
    addItem(makeItem({ menuId: "menu-2", name: "콜라", price: 15000 }), 1);

    const total = useCartStore.getState().getTotal();
    expect(total).toBe(20500 * 2 + 15000);
  });

  it("여러 아이템의 총 수량을 합산한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ menuId: "menu-1" }), 3);
    addItem(makeItem({ menuId: "menu-2", name: "감자튀김" }), 2);

    const totalQty = useCartStore.getState().getTotalQuantity();
    expect(totalQty).toBe(5);
  });

  it("빈 장바구니의 총액과 총 수량은 0이다", () => {
    const state = useCartStore.getState();
    expect(state.getTotal()).toBe(0);
    expect(state.getTotalQuantity()).toBe(0);
  });
});

describe("isDifferentRestaurant", () => {
  it("같은 가게이면 false를 반환한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ restaurantId: "rest-1" }), 1);

    const result = useCartStore.getState().isDifferentRestaurant("rest-1");
    expect(result).toBe(false);
  });

  it("다른 가게이면 true를 반환한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ restaurantId: "rest-1" }), 1);

    const result = useCartStore.getState().isDifferentRestaurant("rest-2");
    expect(result).toBe(true);
  });

  it("빈 장바구니이면 false를 반환한다", () => {
    const result = useCartStore.getState().isDifferentRestaurant("rest-99");
    expect(result).toBe(false);
  });
});

describe("replaceWithItem", () => {
  it("기존 장바구니를 비우고 새 아이템으로 교체한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ menuId: "menu-1", restaurantId: "rest-1" }), 2);
    addItem(makeItem({ menuId: "menu-2", restaurantId: "rest-1" }), 1);

    useCartStore.getState().replaceWithItem(
      makeItem({ menuId: "menu-9", name: "새 메뉴", restaurantId: "rest-2", restaurantName: "새 가게" }),
      3
    );

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].menuId).toBe("menu-9");
    expect(state.items[0].quantity).toBe(3);
    expect(state.restaurantId).toBe("rest-2");
    expect(state.restaurantName).toBe("새 가게");
    expect(state.deliveryFee).toBe(0);
    expect(state.minOrderAmount).toBe(0);
  });
});

describe("setDeliveryInfo + clearCart", () => {
  it("배달 정보를 설정하고 clearCart로 초기화한다", () => {
    const { addItem, setDeliveryInfo, clearCart } = useCartStore.getState();
    addItem(makeItem(), 1);
    setDeliveryInfo(3000, 15000);

    const before = useCartStore.getState();
    expect(before.deliveryFee).toBe(3000);
    expect(before.minOrderAmount).toBe(15000);
    expect(before.items).toHaveLength(1);

    clearCart();

    const after = useCartStore.getState();
    expect(after.items).toHaveLength(0);
    expect(after.restaurantId).toBeNull();
    expect(after.restaurantName).toBeNull();
    expect(after.deliveryFee).toBe(0);
    expect(after.minOrderAmount).toBe(0);
  });
});

describe("generateCartItemKey — 옵션 정렬", () => {
  it("옵션 순서가 달라도 같은 조합이면 같은 키로 병합된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: [OPTION_A, OPTION_B] }), 1);
    addItem(makeItem({ options: [OPTION_B, OPTION_A] }), 2);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("options가 undefined이면 빈 배열로 처리된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: undefined as unknown as CartItemOption[] }), 1);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].options).toEqual([]);
  });
});

describe("addItem — 엣지 케이스", () => {
  it("기존 아이템 수량 증가 시 restaurantId/restaurantName은 변경되지 않는다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ restaurantId: "rest-1", restaurantName: "치킨집A" }), 1);

    // 같은 메뉴를 다시 추가 (restaurantName이 달라도 기존 값 유지)
    addItem(makeItem({ restaurantId: "rest-1", restaurantName: "치킨집B" }), 1);

    const { restaurantName, items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    // 기존 아이템 병합 시 set에 restaurantName이 포함되지 않으므로 원래 값 유지
    expect(restaurantName).toBe("치킨집A");
  });

  it("imageUrl이 있는 아이템을 추가한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ imageUrl: "https://img.example.com/chicken.jpg" }), 1);

    const { items } = useCartStore.getState();
    expect(items[0].imageUrl).toBe("https://img.example.com/chicken.jpg");
  });
});

describe("removeItem — 엣지 케이스", () => {
  it("존재하지 않는 키로 호출해도 에러 없이 기존 상태를 유지한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 1);

    const { removeItem } = useCartStore.getState();
    removeItem("non-existent-key");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
  });
});

describe("updateQuantity — 엣지 케이스", () => {
  it("음수 수량 입력 시 아이템을 제거한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 3);

    const { items, updateQuantity } = useCartStore.getState();
    updateQuantity(items[0].cartItemKey, -1);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("존재하지 않는 키로 호출해도 에러 없이 기존 상태를 유지한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem(), 1);

    const { updateQuantity } = useCartStore.getState();
    updateQuantity("non-existent-key", 5);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });
});

describe("replaceWithItem — 엣지 케이스", () => {
  it("옵션 포함 아이템으로 교체한다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ restaurantId: "rest-1" }), 1);

    useCartStore.getState().replaceWithItem(
      makeItem({
        menuId: "menu-new",
        name: "양념치킨",
        restaurantId: "rest-2",
        restaurantName: "새 가게",
        options: [OPTION_A, OPTION_B],
      }),
      2
    );

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].options).toEqual([OPTION_A, OPTION_B]);
    expect(state.items[0].quantity).toBe(2);
    expect(state.restaurantId).toBe("rest-2");
  });

  it("options가 undefined이면 빈 배열로 교체된다", () => {
    const { addItem } = useCartStore.getState();
    addItem(makeItem({ options: [OPTION_A] }), 1);

    useCartStore.getState().replaceWithItem(
      makeItem({
        menuId: "menu-new",
        restaurantId: "rest-2",
        restaurantName: "새 가게",
        options: undefined as unknown as CartItemOption[],
      }),
      1
    );

    const state = useCartStore.getState();
    expect(state.items[0].options).toEqual([]);
  });

  it("빈 장바구니에서도 교체가 동작한다", () => {
    useCartStore.getState().replaceWithItem(
      makeItem({ restaurantId: "rest-1", restaurantName: "가게A" }),
      3
    );

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.restaurantId).toBe("rest-1");
    expect(state.deliveryFee).toBe(0);
    expect(state.minOrderAmount).toBe(0);
  });
});
