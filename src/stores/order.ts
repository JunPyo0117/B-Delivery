import { create } from "zustand";
import type { OrderStatus, OrderUpdateEvent } from "@/types/order";

interface OrderStatusEntry {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
}

interface OrderStatusState {
  /** orderId -> 상태 정보 */
  orders: Record<string, OrderStatusEntry>;
  /** 가장 최근 업데이트 이벤트 (토스트 알림 등에 활용) */
  lastEvent: OrderUpdateEvent | null;

  // 액션
  /** 초기 주문 상태 설정 (서버에서 fetch한 데이터) */
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  /** 여러 주문 상태를 한번에 설정 */
  setOrderStatuses: (orders: { orderId: string; status: OrderStatus }[]) => void;
  /** WebSocket 이벤트로 상태 업데이트 */
  applyOrderUpdate: (event: OrderUpdateEvent) => void;
  /** 특정 주문 제거 */
  removeOrder: (orderId: string) => void;
  /** 전체 초기화 */
  clearAll: () => void;
}

export const useOrderStore = create<OrderStatusState>((set) => ({
  orders: {},
  lastEvent: null,

  setOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: {
        ...state.orders,
        [orderId]: {
          orderId,
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  setOrderStatuses: (orderList) =>
    set((state) => {
      const updated = { ...state.orders };
      const now = new Date().toISOString();
      for (const { orderId, status } of orderList) {
        updated[orderId] = { orderId, status, updatedAt: now };
      }
      return { orders: updated };
    }),

  applyOrderUpdate: (event) =>
    set((state) => ({
      orders: {
        ...state.orders,
        [event.orderId]: {
          orderId: event.orderId,
          status: event.newStatus,
          updatedAt: event.timestamp,
        },
      },
      lastEvent: event,
    })),

  removeOrder: (orderId) =>
    set((state) => {
      const { [orderId]: _, ...rest } = state.orders;
      return { orders: rest };
    }),

  clearAll: () => set({ orders: {}, lastEvent: null }),
}));
