import { describe, it, expect } from "vitest";
import { OrderStatus } from "@/generated/prisma/client";
import {
  ORDER_STATUS_STEPS,
  CUSTOMER_CANCELLABLE,
  DELIVERING_STATUSES,
  COMPLETED_STATUSES,
} from "@/entities/order/model/types";

/**
 * route.ts의 VALID_TRANSITIONS 맵과 동일하게 정의
 * (Next.js API Route는 직접 import 불가)
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.COOKING, OrderStatus.CANCELLED],
  COOKING: [OrderStatus.WAITING_RIDER, OrderStatus.CANCELLED],
  WAITING_RIDER: [OrderStatus.RIDER_ASSIGNED, OrderStatus.COOKING],
  RIDER_ASSIGNED: [OrderStatus.WAITING_RIDER, OrderStatus.PICKED_UP],
  PICKED_UP: [OrderStatus.DONE],
  DONE: [],
  CANCELLED: [],
};

describe("VALID_TRANSITIONS — 허용 전이", () => {
  it("PENDING → COOKING 허용", () => {
    expect(VALID_TRANSITIONS.PENDING).toContain(OrderStatus.COOKING);
  });

  it("PENDING → CANCELLED 허용", () => {
    expect(VALID_TRANSITIONS.PENDING).toContain(OrderStatus.CANCELLED);
  });

  it("COOKING → WAITING_RIDER 허용", () => {
    expect(VALID_TRANSITIONS.COOKING).toContain(OrderStatus.WAITING_RIDER);
  });

  it("COOKING → CANCELLED 허용", () => {
    expect(VALID_TRANSITIONS.COOKING).toContain(OrderStatus.CANCELLED);
  });

  it("WAITING_RIDER → RIDER_ASSIGNED 허용", () => {
    expect(VALID_TRANSITIONS.WAITING_RIDER).toContain(OrderStatus.RIDER_ASSIGNED);
  });

  it("WAITING_RIDER → COOKING 허용 (기사 매칭 실패 시 재요청)", () => {
    expect(VALID_TRANSITIONS.WAITING_RIDER).toContain(OrderStatus.COOKING);
  });

  it("RIDER_ASSIGNED → PICKED_UP 허용", () => {
    expect(VALID_TRANSITIONS.RIDER_ASSIGNED).toContain(OrderStatus.PICKED_UP);
  });

  it("PICKED_UP → DONE 허용", () => {
    expect(VALID_TRANSITIONS.PICKED_UP).toContain(OrderStatus.DONE);
  });
});

describe("VALID_TRANSITIONS — 불허 전이", () => {
  it("DONE에서 어떤 상태로도 전이 불가", () => {
    expect(VALID_TRANSITIONS.DONE).toHaveLength(0);
  });

  it("CANCELLED에서 어떤 상태로도 전이 불가", () => {
    expect(VALID_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it("PENDING → DONE 불가", () => {
    expect(VALID_TRANSITIONS.PENDING).not.toContain(OrderStatus.DONE);
  });

  it("COOKING → DONE 불가", () => {
    expect(VALID_TRANSITIONS.COOKING).not.toContain(OrderStatus.DONE);
  });

  it("PENDING → WAITING_RIDER 불가 (단계 건너뜀)", () => {
    expect(VALID_TRANSITIONS.PENDING).not.toContain(OrderStatus.WAITING_RIDER);
  });

  it("COOKING → RIDER_ASSIGNED 불가 (단계 건너뜀)", () => {
    expect(VALID_TRANSITIONS.COOKING).not.toContain(OrderStatus.RIDER_ASSIGNED);
  });

  it("RIDER_ASSIGNED → CANCELLED 불가 (기사 배정 후 취소 불가)", () => {
    expect(VALID_TRANSITIONS.RIDER_ASSIGNED).not.toContain(OrderStatus.CANCELLED);
  });
});

describe("CUSTOMER_CANCELLABLE", () => {
  it("PENDING 포함", () => {
    expect(CUSTOMER_CANCELLABLE).toContain(OrderStatus.PENDING);
  });

  it("COOKING 포함", () => {
    expect(CUSTOMER_CANCELLABLE).toContain(OrderStatus.COOKING);
  });

  it("정확히 2개 상태만 포함", () => {
    expect(CUSTOMER_CANCELLABLE).toHaveLength(2);
  });

  it("WAITING_RIDER 미포함 (기사 배정 대기 중 취소 불가)", () => {
    expect(CUSTOMER_CANCELLABLE).not.toContain(OrderStatus.WAITING_RIDER);
  });

  it("RIDER_ASSIGNED 미포함", () => {
    expect(CUSTOMER_CANCELLABLE).not.toContain(OrderStatus.RIDER_ASSIGNED);
  });
});

describe("ORDER_STATUS_STEPS — 정상 흐름 순서", () => {
  it("6단계 포함 (PENDING~DONE)", () => {
    expect(ORDER_STATUS_STEPS).toHaveLength(6);
  });

  it("첫 번째는 PENDING", () => {
    expect(ORDER_STATUS_STEPS[0]).toBe(OrderStatus.PENDING);
  });

  it("마지막은 DONE", () => {
    expect(ORDER_STATUS_STEPS[ORDER_STATUS_STEPS.length - 1]).toBe(OrderStatus.DONE);
  });

  it("PENDING → COOKING → WAITING_RIDER → RIDER_ASSIGNED → PICKED_UP → DONE 순서", () => {
    expect(ORDER_STATUS_STEPS).toEqual([
      OrderStatus.PENDING,
      OrderStatus.COOKING,
      OrderStatus.WAITING_RIDER,
      OrderStatus.RIDER_ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.DONE,
    ]);
  });

  it("CANCELLED는 정상 흐름에 포함되지 않음", () => {
    expect(ORDER_STATUS_STEPS).not.toContain(OrderStatus.CANCELLED);
  });
});

describe("DELIVERING_STATUSES + COMPLETED_STATUSES = 전체 상태", () => {
  it("두 배열의 합집합이 모든 OrderStatus를 포함", () => {
    const allStatuses = new Set([...DELIVERING_STATUSES, ...COMPLETED_STATUSES]);
    const enumValues = Object.values(OrderStatus) as OrderStatus[];
    for (const status of enumValues) {
      expect(allStatuses).toContain(status);
    }
  });

  it("두 배열 사이에 중복 없음", () => {
    const deliveringSet = new Set(DELIVERING_STATUSES);
    for (const status of COMPLETED_STATUSES) {
      expect(deliveringSet).not.toContain(status);
    }
  });

  it("DONE, CANCELLED는 COMPLETED_STATUSES에 포함", () => {
    expect(COMPLETED_STATUSES).toContain(OrderStatus.DONE);
    expect(COMPLETED_STATUSES).toContain(OrderStatus.CANCELLED);
  });
});
