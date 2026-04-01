import type { OrderStatus } from "@/generated/prisma/client"

export interface OrderCardData {
  id: string
  status: OrderStatus
  totalPrice: number
  deliveryFee: number
  deliveryAddress: string
  deliveryNote: string | null
  restaurantName: string
  restaurantImageUrl: string | null
  items: OrderItemData[]
  createdAt: Date
  updatedAt: Date
  hasReview: boolean
}

export interface OrderItemData {
  id: string
  menuName: string
  quantity: number
  price: number
  optionPrice: number
  selectedOptions: SelectedOption[] | null
}

export interface SelectedOption {
  groupName: string
  optionName: string
  extraPrice: number
}

export interface OrderDetailData extends OrderCardData {
  restaurantId: string
  restaurantLat: number
  restaurantLng: number
  deliveryLat: number
  deliveryLng: number
  delivery: DeliveryData | null
}

export interface DeliveryData {
  id: string
  status: string
  riderNickname: string | null
  riderTransport: string | null
  estimatedTime: number | null
}

/** 주문 상태 라벨 (고객 관점) */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "주문이 접수되었습니다",
  COOKING: "음식을 조리하고 있어요",
  WAITING_RIDER: "배달기사를 찾고 있어요...",
  RIDER_ASSIGNED: "배달기사가 배정되었습니다",
  PICKED_UP: "배달 중이에요",
  DONE: "배달이 완료되었습니다",
  CANCELLED: "주문이 취소되었습니다",
}

/** 주문 진행 단계 (정상 흐름) */
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "PENDING",
  "COOKING",
  "WAITING_RIDER",
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "DONE",
]

/** 고객이 취소 가능한 상태 */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "COOKING"]

/** 배달 중인 상태 목록 */
export const DELIVERING_STATUSES: OrderStatus[] = [
  "PENDING",
  "COOKING",
  "WAITING_RIDER",
  "RIDER_ASSIGNED",
  "PICKED_UP",
]

/** 완료된 상태 목록 */
export const COMPLETED_STATUSES: OrderStatus[] = ["DONE", "CANCELLED"]

/**
 * 새 상태가 현재 상태보다 진행 방향으로 앞에 있는지 판단.
 * onConnected 재조회 시 stale 데이터로 WebSocket 이벤트를 덮어쓰지 않도록 사용.
 */
export function isStatusAhead(
  newStatus: OrderStatus,
  currentStatus: OrderStatus
): boolean {
  // CANCELLED는 특수 처리: 진입은 허용, 탈출은 불가
  if (currentStatus === "CANCELLED") return false;
  if (newStatus === "CANCELLED") return true;

  const newIdx = ORDER_STATUS_STEPS.indexOf(newStatus);
  const curIdx = ORDER_STATUS_STEPS.indexOf(currentStatus);
  if (newIdx === -1 || curIdx === -1) return false;
  return newIdx > curIdx;
}

/** 주문 생성 입력 데이터 */
export interface CreateOrderInput {
  restaurantId: string
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  deliveryNote?: string
  items: CreateOrderItemInput[]
}

export interface CreateOrderItemInput {
  menuId: string
  quantity: number
  price: number
  optionPrice: number
  selectedOptions: SelectedOption[] | null
}

/** 주문 취소 입력 데이터 */
export interface CancelOrderInput {
  orderId: string
  cancelReason: string
}
