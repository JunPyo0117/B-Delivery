export type OrderStatus =
  | "PENDING"
  | "COOKING"
  | "WAITING_RIDER"
  | "RIDER_ASSIGNED"
  | "PICKED_UP"
  | "DONE"
  | "CANCELLED";

export type DeliveryStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "AT_STORE"
  | "PICKED_UP"
  | "DELIVERING"
  | "DONE"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  WAITING_RIDER: "기사 매칭 대기",
  RIDER_ASSIGNED: "기사 배정됨",
  PICKED_UP: "배달중",
  DONE: "배달 완료",
  CANCELLED: "취소됨",
};

/** 주문 상태 전이 규칙 (State Machine) */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["COOKING", "CANCELLED"],
  COOKING: ["WAITING_RIDER", "CANCELLED"],
  WAITING_RIDER: ["RIDER_ASSIGNED", "COOKING"],
  RIDER_ASSIGNED: ["WAITING_RIDER", "PICKED_UP"],
  PICKED_UP: ["DONE"],
  DONE: [],
  CANCELLED: [],
};

export interface OrderUpdateEvent {
  orderId: string;
  newStatus: OrderStatus;
  userId: string;
  timestamp: string;
}

export interface OrderStatusEntry {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
}
