import { describe, it, expect } from "vitest";
import {
  buildOrderStatusPayload,
  buildDeliveryRequestPayload,
} from "@/shared/lib/order-events";

describe("buildOrderStatusPayload — Worker→클라이언트 이벤트 계약", () => {
  it("type 필드가 'order:status_changed'이다", () => {
    const payload = buildOrderStatusPayload({
      orderId: "order-1",
      newStatus: "COOKING",
      userId: "user-1",
      timestamp: "2026-04-01T00:00:00Z",
    });

    expect(payload.type).toBe("order:status_changed");
  });

  it("status 필드에 새 상태값이 포함된다 (newStatus가 아닌 status)", () => {
    const payload = buildOrderStatusPayload({
      orderId: "order-1",
      newStatus: "WAITING_RIDER",
      userId: "user-1",
      timestamp: "2026-04-01T00:00:00Z",
    });

    expect(payload.status).toBe("WAITING_RIDER");
    expect(payload).not.toHaveProperty("newStatus");
  });

  it("orderId와 timestamp가 그대로 포함된다", () => {
    const payload = buildOrderStatusPayload({
      orderId: "order-99",
      newStatus: "DONE",
      userId: "user-1",
      timestamp: "2026-04-01T12:00:00Z",
    });

    expect(payload.orderId).toBe("order-99");
    expect(payload.timestamp).toBe("2026-04-01T12:00:00Z");
  });
});

describe("buildDeliveryRequestPayload — Worker→기사 배달 요청 계약", () => {
  it("type 필드가 'delivery:new_request'이다", () => {
    const payload = buildDeliveryRequestPayload({
      orderId: "order-1",
      restaurantName: "맛있는 치킨집",
      pickupLat: 37.5665,
      pickupLng: 126.978,
      dropoffLat: 37.4979,
      dropoffLng: 127.0276,
      riderFee: 4000,
    });

    expect(payload.type).toBe("delivery:new_request");
  });

  it("모든 배달 정보 필드가 포함된다", () => {
    const payload = buildDeliveryRequestPayload({
      orderId: "order-1",
      restaurantName: "맛있는 치킨집",
      pickupLat: 37.5665,
      pickupLng: 126.978,
      dropoffLat: 37.4979,
      dropoffLng: 127.0276,
      riderFee: 4000,
    });

    expect(payload.orderId).toBe("order-1");
    expect(payload.restaurantName).toBe("맛있는 치킨집");
    expect(payload.pickupLat).toBe(37.5665);
    expect(payload.riderFee).toBe(4000);
  });
});
