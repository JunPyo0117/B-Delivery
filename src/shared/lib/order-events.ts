/**
 * Worker → Centrifugo → 클라이언트 간 이벤트 payload 계약
 * Worker와 클라이언트가 동일한 필드명을 사용하도록 보장
 */

interface OrderStreamData {
  orderId: string;
  newStatus: string;
  userId: string;
  timestamp: string;
}

interface DeliveryStreamData {
  orderId: string;
  restaurantName: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  riderFee: number;
}

/** 주문 상태 변경 이벤트 payload (order#<userId> 채널) */
export function buildOrderStatusPayload(data: OrderStreamData) {
  return {
    type: "order:status_changed" as const,
    orderId: data.orderId,
    status: data.newStatus,
    timestamp: data.timestamp,
  };
}

/** 배달 요청 이벤트 payload (delivery_requests#<riderId> 채널) */
export function buildDeliveryRequestPayload(data: DeliveryStreamData) {
  return {
    type: "delivery:new_request" as const,
    orderId: data.orderId,
    restaurantName: data.restaurantName,
    pickupLat: data.pickupLat,
    pickupLng: data.pickupLng,
    dropoffLat: data.dropoffLat,
    dropoffLng: data.dropoffLng,
    riderFee: data.riderFee,
  };
}
