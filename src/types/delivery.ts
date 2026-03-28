import type { DeliveryStatus } from "./order";

export type TransportType = "WALK" | "BICYCLE" | "MOTORCYCLE" | "CAR";

/** 이동수단별 평균속도 (km/h) */
export const TRANSPORT_SPEED: Record<TransportType, number> = {
  WALK: 4,
  BICYCLE: 15,
  MOTORCYCLE: 30,
  CAR: 25,
};

export interface DeliveryRequestEvent {
  orderId: string;
  restaurantName: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distance: number;
  riderFee: number;
}

export interface DeliveryAcceptEvent {
  orderId: string;
  riderId: string;
  riderNickname: string;
  transportType: TransportType;
}

export interface RiderLocationEvent {
  orderId: string;
  riderId: string;
  lat: number;
  lng: number;
  estimatedMinutes: number;
}

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  REQUESTED: "배달 요청됨",
  ACCEPTED: "기사 수락",
  AT_STORE: "가게 도착",
  PICKED_UP: "픽업 완료",
  DELIVERING: "배달 중",
  DONE: "배달 완료",
  CANCELLED: "취소",
};
