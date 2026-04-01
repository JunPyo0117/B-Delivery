import { describe, it, expect, beforeEach } from "vitest";
import { useOrderStore } from "@/features/order/model/orderStore";
import type { OrderUpdateEvent } from "@/types/order";

beforeEach(() => {
  useOrderStore.setState({
    orders: {},
    statuses: {},
    lastEvent: null,
    riderLocation: null,
  });
});

describe("setOrderStatus", () => {
  it("주문 상태를 설정한다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");

    const state = useOrderStore.getState();
    expect(state.orders["order-1"]).toBeDefined();
    expect(state.orders["order-1"].status).toBe("PENDING");
    expect(state.orders["order-1"].orderId).toBe("order-1");
  });

  it("orders와 statuses가 동기화된다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "COOKING");

    const state = useOrderStore.getState();
    expect(state.orders["order-1"]).toEqual(state.statuses["order-1"]);
  });

  it("기존 상태를 덮어쓴다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");
    useOrderStore.getState().setOrderStatus("order-1", "COOKING");

    expect(useOrderStore.getState().orders["order-1"].status).toBe("COOKING");
  });
});

describe("setStatus (별칭)", () => {
  it("setOrderStatus와 동일하게 동작한다", () => {
    useOrderStore.getState().setStatus("order-1", "PENDING");

    const state = useOrderStore.getState();
    expect(state.orders["order-1"].status).toBe("PENDING");
    expect(state.statuses["order-1"].status).toBe("PENDING");
  });
});

describe("setOrderStatuses", () => {
  it("여러 주문 상태를 한번에 설정한다", () => {
    useOrderStore.getState().setOrderStatuses([
      { orderId: "order-1", status: "PENDING" },
      { orderId: "order-2", status: "COOKING" },
      { orderId: "order-3", status: "DONE" },
    ]);

    const state = useOrderStore.getState();
    expect(Object.keys(state.orders)).toHaveLength(3);
    expect(state.orders["order-1"].status).toBe("PENDING");
    expect(state.orders["order-2"].status).toBe("COOKING");
    expect(state.orders["order-3"].status).toBe("DONE");
  });

  it("기존 상태에 추가/덮어쓴다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");

    useOrderStore.getState().setOrderStatuses([
      { orderId: "order-1", status: "COOKING" },
      { orderId: "order-2", status: "DONE" },
    ]);

    const state = useOrderStore.getState();
    expect(state.orders["order-1"].status).toBe("COOKING");
    expect(state.orders["order-2"].status).toBe("DONE");
  });

  it("orders와 statuses가 동기화된다", () => {
    useOrderStore.getState().setOrderStatuses([
      { orderId: "o1", status: "PENDING" },
    ]);

    const state = useOrderStore.getState();
    expect(state.orders).toEqual(state.statuses);
  });
});

describe("applyOrderUpdate", () => {
  it("WebSocket 이벤트로 상태를 업데이트한다", () => {
    const event: OrderUpdateEvent = {
      orderId: "order-1",
      newStatus: "COOKING",
      userId: "user-1",
      timestamp: "2026-03-31T10:00:00.000Z",
    };

    useOrderStore.getState().applyOrderUpdate(event);

    const state = useOrderStore.getState();
    expect(state.orders["order-1"].status).toBe("COOKING");
    expect(state.orders["order-1"].updatedAt).toBe(
      "2026-03-31T10:00:00.000Z"
    );
    expect(state.lastEvent).toEqual(event);
  });

  it("lastEvent를 최신 이벤트로 갱신한다", () => {
    const event1: OrderUpdateEvent = {
      orderId: "order-1",
      newStatus: "COOKING",
      userId: "user-1",
      timestamp: "2026-03-31T10:00:00.000Z",
    };
    const event2: OrderUpdateEvent = {
      orderId: "order-1",
      newStatus: "WAITING_RIDER",
      userId: "user-1",
      timestamp: "2026-03-31T10:05:00.000Z",
    };

    useOrderStore.getState().applyOrderUpdate(event1);
    useOrderStore.getState().applyOrderUpdate(event2);

    const state = useOrderStore.getState();
    expect(state.lastEvent).toEqual(event2);
    expect(state.orders["order-1"].status).toBe("WAITING_RIDER");
  });

  it("orders와 statuses가 동기화된다", () => {
    const event: OrderUpdateEvent = {
      orderId: "order-1",
      newStatus: "DONE",
      userId: "user-1",
      timestamp: "2026-03-31T12:00:00.000Z",
    };

    useOrderStore.getState().applyOrderUpdate(event);

    const state = useOrderStore.getState();
    expect(state.orders).toEqual(state.statuses);
  });
});

describe("removeOrder", () => {
  it("특정 주문을 제거한다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");
    useOrderStore.getState().setOrderStatus("order-2", "COOKING");

    useOrderStore.getState().removeOrder("order-1");

    const state = useOrderStore.getState();
    expect(state.orders["order-1"]).toBeUndefined();
    expect(state.orders["order-2"]).toBeDefined();
  });

  it("orders와 statuses가 동기화된다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");
    useOrderStore.getState().removeOrder("order-1");

    const state = useOrderStore.getState();
    expect(state.orders).toEqual(state.statuses);
  });

  it("존재하지 않는 orderId로 호출해도 에러가 발생하지 않는다", () => {
    expect(() =>
      useOrderStore.getState().removeOrder("non-existent")
    ).not.toThrow();
  });
});

describe("setRiderLocation", () => {
  it("배달 기사 위치를 설정한다", () => {
    useOrderStore
      .getState()
      .setRiderLocation({ lat: 37.4979, lng: 127.0276, estimatedMinutes: 10 });

    const state = useOrderStore.getState();
    expect(state.riderLocation).toEqual({
      lat: 37.4979,
      lng: 127.0276,
      estimatedMinutes: 10,
    });
  });

  it("null로 설정하면 위치를 제거한다", () => {
    useOrderStore
      .getState()
      .setRiderLocation({ lat: 37.4979, lng: 127.0276, estimatedMinutes: 10 });
    useOrderStore.getState().setRiderLocation(null);

    expect(useOrderStore.getState().riderLocation).toBeNull();
  });
});

describe("getState() 액션 참조 안정성 — WebSocket 재연결 방지 회귀 테스트", () => {
  it("상태 변경 후에도 getState().setOrderStatus는 동일한 함수 참조를 유지한다", () => {
    const refBefore = useOrderStore.getState().setOrderStatus;

    // 상태 변경 (이전에는 이 변경이 useEffect 재실행 → WebSocket 재연결을 유발함)
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");
    useOrderStore.getState().setOrderStatus("order-1", "COOKING");
    useOrderStore.getState().setOrderStatus("order-1", "WAITING_RIDER");

    const refAfter = useOrderStore.getState().setOrderStatus;
    expect(refAfter).toBe(refBefore);
  });

  it("상태 변경 후에도 getState().applyOrderUpdate는 동일한 함수 참조를 유지한다", () => {
    const refBefore = useOrderStore.getState().applyOrderUpdate;

    useOrderStore.getState().applyOrderUpdate({
      orderId: "order-1",
      newStatus: "COOKING",
      userId: "user-1",
      timestamp: "2026-04-01T00:00:00Z",
    });

    const refAfter = useOrderStore.getState().applyOrderUpdate;
    expect(refAfter).toBe(refBefore);
  });

  it("연속 상태 업데이트 시 모든 이벤트가 누락 없이 반영된다", () => {
    const setStatus = useOrderStore.getState().setOrderStatus;

    // useCentrifugoOrder가 ref로 캡처한 함수를 연속 호출하는 시나리오
    setStatus("order-1", "PENDING");
    setStatus("order-1", "COOKING");
    setStatus("order-1", "WAITING_RIDER");
    setStatus("order-1", "RIDER_ASSIGNED");
    setStatus("order-1", "PICKED_UP");
    setStatus("order-1", "DONE");

    expect(useOrderStore.getState().orders["order-1"].status).toBe("DONE");
  });
});

describe("clearAll", () => {
  it("전체 상태를 초기화한다", () => {
    useOrderStore.getState().setOrderStatus("order-1", "PENDING");
    useOrderStore.getState().applyOrderUpdate({
      orderId: "order-1",
      newStatus: "COOKING",
      userId: "user-1",
      timestamp: "2026-03-31T10:00:00.000Z",
    });
    useOrderStore
      .getState()
      .setRiderLocation({ lat: 37.4979, lng: 127.0276, estimatedMinutes: 5 });

    useOrderStore.getState().clearAll();

    const state = useOrderStore.getState();
    expect(state.orders).toEqual({});
    expect(state.statuses).toEqual({});
    expect(state.lastEvent).toBeNull();
    expect(state.riderLocation).toBeNull();
  });
});
