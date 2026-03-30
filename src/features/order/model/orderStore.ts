import { create } from "zustand";
import type { OrderStatus, OrderUpdateEvent } from "@/types/order";

interface OrderStatusEntry {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
}

interface RiderLocation {
  lat: number;
  lng: number;
  estimatedMinutes: number;
}

interface OrderStatusState {
  /** orderId -> 상태 정보 */
  orders: Record<string, OrderStatusEntry>;
  /** orders의 별칭 (하위호환) */
  statuses: Record<string, OrderStatusEntry>;
  /** 가장 최근 업데이트 이벤트 (토스트 알림 등에 활용) */
  lastEvent: OrderUpdateEvent | null;
  /** 배달 기사 실시간 위치 */
  riderLocation: RiderLocation | null;

  // 액션
  /** 초기 주문 상태 설정 (서버에서 fetch한 데이터) */
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  /** setOrderStatus의 별칭 (하위호환) */
  setStatus: (orderId: string, status: OrderStatus) => void;
  /** 여러 주문 상태를 한번에 설정 */
  setOrderStatuses: (orders: { orderId: string; status: OrderStatus }[]) => void;
  /** WebSocket 이벤트로 상태 업데이트 */
  applyOrderUpdate: (event: OrderUpdateEvent) => void;
  /** 특정 주문 제거 */
  removeOrder: (orderId: string) => void;
  /** 배달 기사 위치 업데이트 */
  setRiderLocation: (location: RiderLocation | null) => void;
  /** 전체 초기화 */
  clearAll: () => void;
}

export type { OrderStatusState, RiderLocation };

const setOrderStatusAction = (
  orderId: string,
  status: OrderStatus,
  state: OrderStatusState
) => {
  const entry: OrderStatusEntry = {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  };
  const newOrders = { ...state.orders, [orderId]: entry };
  return { orders: newOrders, statuses: newOrders };
};

export const useOrderStore = create<OrderStatusState>((set) => ({
  orders: {},
  statuses: {},
  lastEvent: null,
  riderLocation: null,

  setOrderStatus: (orderId, status) =>
    set((state) => setOrderStatusAction(orderId, status, state)),

  setStatus: (orderId, status) =>
    set((state) => setOrderStatusAction(orderId, status, state)),

  setOrderStatuses: (orderList) =>
    set((state) => {
      const updated = { ...state.orders };
      const now = new Date().toISOString();
      for (const { orderId, status } of orderList) {
        updated[orderId] = { orderId, status, updatedAt: now };
      }
      return { orders: updated, statuses: updated };
    }),

  applyOrderUpdate: (event) =>
    set((state) => {
      const entry: OrderStatusEntry = {
        orderId: event.orderId,
        status: event.newStatus,
        updatedAt: event.timestamp,
      };
      const newOrders = { ...state.orders, [event.orderId]: entry };
      return {
        orders: newOrders,
        statuses: newOrders,
        lastEvent: event,
      };
    }),

  removeOrder: (orderId) =>
    set((state) => {
      const { [orderId]: _, ...rest } = state.orders;
      return { orders: rest, statuses: rest };
    }),

  setRiderLocation: (location) => set({ riderLocation: location }),

  clearAll: () =>
    set({ orders: {}, statuses: {}, lastEvent: null, riderLocation: null }),
}));
