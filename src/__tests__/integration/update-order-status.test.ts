import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession } from "../helpers/auth-mock";
import { ORDER, RESTAURANT } from "../helpers/fixtures";
import { OrderStatus } from "@/generated/prisma/client";

// auth mock — setup.ts의 prisma/redis mock은 자동 적용됨
vi.mock("@/auth", () => ({ auth: vi.fn() }));

// next/cache mock
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { updateOrderStatus } from "@/app/(owner)/owner/orders/_actions/update-order-status";

const mockAuth = auth as ReturnType<typeof vi.fn>;

/** OWNER 세션: owner-1이 owner인 음식점 */
const ownerSession = createMockSession({ id: "owner-1", role: "OWNER" });
/** ADMIN 세션 */
const adminSession = createMockSession({ id: "admin-1", role: "ADMIN" });
/** 다른 OWNER 세션 */
const otherOwnerSession = createMockSession({ id: "owner-2", role: "OWNER" });

/** fixtures.ORDER에 restaurant 포함한 mock 반환값 */
const pendingOrder = {
  ...ORDER,
  status: OrderStatus.PENDING,
  restaurant: {
    ownerId: RESTAURANT.ownerId,
    name: RESTAURANT.name,
    latitude: RESTAURANT.latitude,
    longitude: RESTAURANT.longitude,
  },
};

const cookingOrder = {
  ...pendingOrder,
  status: OrderStatus.COOKING,
};

describe("updateOrderStatus", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    // $transaction: fn(prismaClient) 패턴 그대로 실행
    prismaMock.$transaction.mockImplementation((fn: (tx: typeof prismaMock) => Promise<unknown>) =>
      fn(prismaMock)
    );
  });

  it("PENDING → COOKING 성공", async () => {
    mockAuth.mockResolvedValue(ownerSession);
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateOrderStatus(ORDER.id, OrderStatus.COOKING);

    expect(result).toEqual({ success: true });
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ORDER.id, status: OrderStatus.PENDING }),
        data: expect.objectContaining({ status: OrderStatus.COOKING }),
      })
    );
  });

  it("유효하지 않은 전이 거부 — PENDING → DONE", async () => {
    mockAuth.mockResolvedValue(ownerSession);
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);

    const result = await updateOrderStatus(ORDER.id, OrderStatus.DONE);

    expect(result.success).toBe(false);
    expect(result.error).toContain("허용되지 않습니다");
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });

  it("다른 사장 주문 변경 불가", async () => {
    mockAuth.mockResolvedValue(otherOwnerSession);
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);

    const result = await updateOrderStatus(ORDER.id, OrderStatus.COOKING);

    expect(result.success).toBe(false);
    expect(result.error).toContain("권한이 없습니다");
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });

  it("COOKING → WAITING_RIDER 시 Delivery 생성 확인", async () => {
    mockAuth.mockResolvedValue(ownerSession);
    prismaMock.order.findUnique.mockResolvedValue(cookingOrder as any);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.delivery.create.mockResolvedValue({} as any);

    const result = await updateOrderStatus(ORDER.id, OrderStatus.WAITING_RIDER);

    expect(result).toEqual({ success: true });
    expect(prismaMock.delivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: ORDER.id,
          status: "REQUESTED",
          pickupLat: RESTAURANT.latitude,
          pickupLng: RESTAURANT.longitude,
          riderFee: ORDER.deliveryFee,
        }),
      })
    );
  });

  it("비인증 사용자 거부", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateOrderStatus(ORDER.id, OrderStatus.COOKING);

    expect(result.success).toBe(false);
    expect(result.error).toContain("로그인");
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
  });

  it("ADMIN은 소유권 무관하게 변경 가능", async () => {
    mockAuth.mockResolvedValue(adminSession);
    // ADMIN이 다른 사장의 주문을 변경 — ownerId가 admin-1이 아님
    prismaMock.order.findUnique.mockResolvedValue(pendingOrder as any);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateOrderStatus(ORDER.id, OrderStatus.COOKING);

    expect(result).toEqual({ success: true });
    expect(prismaMock.order.updateMany).toHaveBeenCalled();
  });
});
