import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 장바구니 아이템에 선택된 옵션 */
export interface CartItemOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

/** 장바구니 아이템 타입 */
export interface CartItem {
  /** 고유 식별키: menuId + 옵션 조합 해시 */
  cartItemKey: string;
  menuId: string;
  name: string;
  price: number;
  options: CartItemOption[];
  imageUrl: string | null;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

/** menuId + 정렬된 optionId 목록으로 고유키 생성 */
function generateCartItemKey(
  menuId: string,
  options: CartItemOption[]
): string {
  const sortedOptionIds = options
    .map((o) => o.optionId)
    .sort()
    .join(",");
  return `${menuId}::${sortedOptionIds}`;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  minOrderAmount: number;

  // 액션
  addItem: (
    item: Omit<CartItem, "quantity" | "cartItemKey" | "options"> & {
      options?: CartItemOption[];
    },
    quantity: number
  ) => void;
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryInfo: (deliveryFee: number, minOrderAmount: number) => void;

  // 파생 값 헬퍼
  getTotal: () => number;
  getTotalQuantity: () => number;
  /** 다른 가게 메뉴가 담겨 있는지 확인 */
  isDifferentRestaurant: (restaurantId: string) => boolean;
  /** 기존 장바구니를 비우고 새 가게 아이템 추가 */
  replaceWithItem: (
    item: Omit<CartItem, "quantity" | "cartItemKey" | "options"> & {
      options?: CartItemOption[];
    },
    quantity: number
  ) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      minOrderAmount: 0,

      addItem: (item, quantity) => {
        const state = get();
        const options = item.options ?? [];
        const key = generateCartItemKey(item.menuId, options);
        const existing = state.items.find((i) => i.cartItemKey === key);

        if (existing) {
          // 같은 메뉴 + 같은 옵션 조합이면 수량 증가
          set({
            items: state.items.map((i) =>
              i.cartItemKey === key
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          // 새 메뉴(또는 다른 옵션 조합) 추가
          set({
            items: [
              ...state.items,
              { ...item, options, quantity, cartItemKey: key },
            ],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
          });
        }
      },

      removeItem: (cartItemKey) => {
        const state = get();
        const newItems = state.items.filter(
          (i) => i.cartItemKey !== cartItemKey
        );
        if (newItems.length === 0) {
          set({
            items: [],
            restaurantId: null,
            restaurantName: null,
            deliveryFee: 0,
            minOrderAmount: 0,
          });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (cartItemKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemKey);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemKey === cartItemKey ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          deliveryFee: 0,
          minOrderAmount: 0,
        }),

      setDeliveryInfo: (deliveryFee, minOrderAmount) =>
        set({ deliveryFee, minOrderAmount }),

      getTotal: () => {
        return get().items.reduce((sum, i) => {
          const optionPrice = i.options.reduce(
            (acc, o) => acc + o.extraPrice,
            0
          );
          return sum + (i.price + optionPrice) * i.quantity;
        }, 0);
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      isDifferentRestaurant: (restaurantId) => {
        const state = get();
        return state.items.length > 0 && state.restaurantId !== restaurantId;
      },

      replaceWithItem: (item, quantity) => {
        const options = item.options ?? [];
        const key = generateCartItemKey(item.menuId, options);
        set({
          items: [{ ...item, options, quantity, cartItemKey: key }],
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          deliveryFee: 0,
          minOrderAmount: 0,
        });
      },
    }),
    {
      name: "bdelivery-cart", // localStorage 키
    }
  )
);
