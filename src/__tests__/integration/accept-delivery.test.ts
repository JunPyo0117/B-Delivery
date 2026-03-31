import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession } from "../helpers/auth-mock";
import { ORDER, DELIVERY } from "../helpers/fixtures";
import { DeliveryStatus, OrderStatus } from "@/generated/prisma/client";

// auth mock — setup.ts의 prisma/redis/centrifugo mock은 자동 적용됨
vi.mock("@/auth", () => ({ auth: vi.fn() }));

// next/cache mock
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { acceptDelivery } from "@/app/(rider)/_actions/rider-actions";

const mockAuth = auth as ReturnType<typeof vi.fn>;

const riderSession = createMockSession({ id: "rider-1", role: "RIDER" });

describe("acceptDelivery", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    // 기본: 진행 중 배달 없음
    prismaMock.delivery.findFirst.mockResolvedValue(null);
    // $transaction: fn(prismaClient) 패턴 그대로 실행
    prismaMock.$transaction.mockImplementation(
      (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock)
    );
  });

  it("정상 수락 — delivery.updateMany count 1 + order.update 호출", async () => {
    mockAuth.mockResolvedValue(riderSession);
    // 트랜잭션 내부: order 조회 → WAITING_RIDER
    prismaMock.order.findUnique.mockResolvedValue({
      ...ORDER,
      status: OrderStatus.WAITING_RIDER,
    } as any);
    // delivery.updateMany: 1건 수락
    prismaMock.delivery.updateMany.mockResolvedValue({ count: 1 });
    // order.update 성공
    prismaMock.order.update.mockResolvedValue({} as any);
    // 수락 후 deliveryId 조회
    prismaMock.delivery.findUnique
      .mockResolvedValueOnce({ id: DELIVERY.id } as any)
      // 고객/사장 채널 발행용 order 조회
      .mockResolvedValueOnce(undefined);
    // order 조회 (publish용)
    prismaMock.order.findUnique.mockResolvedValue({
      userId: ORDER.userId,
      restaurant: { ownerId: "owner-1" },
    } as any);

    const result = await acceptDelivery(ORDER.id);

    expect(result.success).toBe(true);
    expect(prismaMock.delivery.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orderId: ORDER.id,
          status: DeliveryStatus.REQUESTED,
        }),
        data: expect.objectContaining({
          riderId: riderSession.user.id,
          status: DeliveryStatus.ACCEPTED,
        }),
      })
    );
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORDER.id },
        data: { status: OrderStatus.RIDER_ASSIGNED },
      })
    );
  });

  it("이미 수락된 배달 — updateMany count 0으로 에러 반환", async () => {
    mockAuth.mockResolvedValue(riderSession);
    prismaMock.order.findUnique.mockResolvedValue({
      ...ORDER,
      status: OrderStatus.WAITING_RIDER,
    } as any);
    // 다른 기사가 먼저 수락해서 0건
    prismaMock.delivery.updateMany.mockResolvedValue({ count: 0 });

    const result = await acceptDelivery(ORDER.id);

    expect(result.success).toBeUndefined();
    expect(result.error).toContain("이미 다른 기사가 수락했거나");
  });

  it("진행 중 배달 있을 때 거부", async () => {
    mockAuth.mockResolvedValue(riderSession);
    // 이미 진행 중인 배달 존재
    prismaMock.delivery.findFirst.mockResolvedValue({
      ...DELIVERY,
      riderId: riderSession.user.id,
      status: DeliveryStatus.ACCEPTED,
    } as any);

    const result = await acceptDelivery(ORDER.id);

    expect(result.success).toBeUndefined();
    expect(result.error).toContain("이미 진행 중인 배달");
    // 트랜잭션 진입 없어야 함
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("Order가 WAITING_RIDER가 아닐 때 거부", async () => {
    mockAuth.mockResolvedValue(riderSession);
    // 주문이 COOKING 상태 (배달 대기 아님)
    prismaMock.order.findUnique.mockResolvedValue({
      ...ORDER,
      status: OrderStatus.COOKING,
    } as any);

    const result = await acceptDelivery(ORDER.id);

    expect(result.success).toBeUndefined();
    expect(result.error).toContain("배달 대기 상태가 아닙니다");
    expect(prismaMock.delivery.updateMany).not.toHaveBeenCalled();
  });
});
