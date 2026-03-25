// 주문 상태 (Prisma OrderStatus enum과 매핑)
export type OrderStatus = "PENDING" | "COOKING" | "PICKED_UP" | "DONE" | "CANCELLED";

// Go chat-server의 OrderUpdateEvent와 매핑
export interface OrderUpdateEvent {
  orderId: string;
  newStatus: OrderStatus;
  userId: string;
  timestamp: string;
}

// 주문 상태 한글 라벨
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  PICKED_UP: "배달중",
  DONE: "배달 완료",
  CANCELLED: "취소됨",
};

// 주문 상태 흐름 (다음 가능 상태)
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["COOKING", "CANCELLED"],
  COOKING: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["DONE"],
  DONE: [],
  CANCELLED: [],
};
