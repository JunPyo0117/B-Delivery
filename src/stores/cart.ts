import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 장바구니 아이템 타입 */
export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;

  // 액션
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;

  // 파생 값 헬퍼
  getTotal: () => number;
  getTotalQuantity: () => number;
  /** 다른 가게 메뉴가 담겨 있는지 확인 */
  isDifferentRestaurant: (restaurantId: string) => boolean;
  /** 기존 장바구니를 비우고 새 가게 아이템 추가 */
  replaceWithItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (item, quantity) => {
        const state = get();
        const existing = state.items.find((i) => i.menuId === item.menuId);

        if (existing) {
          // 같은 메뉴가 이미 있으면 수량 증가
          set({
            items: state.items.map((i) =>
              i.menuId === item.menuId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          // 새 메뉴 추가
          set({
            items: [...state.items, { ...item, quantity }],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
          });
        }
      },

      removeItem: (menuId) => {
        const state = get();
        const newItems = state.items.filter((i) => i.menuId !== menuId);
        if (newItems.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (menuId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuId === menuId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      getTotal: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      isDifferentRestaurant: (restaurantId) => {
        const state = get();
        return state.items.length > 0 && state.restaurantId !== restaurantId;
      },

      replaceWithItem: (item, quantity) => {
        set({
          items: [{ ...item, quantity }],
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
        });
      },
    }),
    {
      name: "bdelivery-cart", // localStorage 키
    }
  )
);
