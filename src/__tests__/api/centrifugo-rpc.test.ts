import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { redisMock } from "../helpers/redis-mock";
import { POST } from "@/app/api/centrifugo/rpc/route";

const PROXY_SECRET = "test-secret";

function makeRequest(body: Record<string, unknown>, secret?: string) {
  return new Request("http://localhost/api/centrifugo/rpc", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(secret !== undefined ? { "X-Centrifugo-Proxy-Secret": secret } : {}),
    },
  });
}

describe("POST /api/centrifugo/rpc", () => {
  beforeEach(() => {
    process.env.CENTRIFUGO_PROXY_SECRET = PROXY_SECRET;
  });

  // ────────────────────────────────────────────────────────────
  // 1. 인증
  // ────────────────────────────────────────────────────────────
  it("1. Proxy Secret 미제공 시 403 반환", async () => {
    const req = makeRequest(
      { user: "user-1", method: "location:update", data: {} },
      "wrong-secret"
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
  });

  // ────────────────────────────────────────────────────────────
  // 2-3. location:update
  // ────────────────────────────────────────────────────────────
  it("2. location:update — RIDER 프로필 없으면 403", async () => {
    prismaMock.riderProfile.findUnique.mockResolvedValue(null);

    const req = makeRequest(
      {
        user: "user-1",
        method: "location:update",
        data: { lat: 37.5, lng: 127.0 },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
    expect(json.error.message).toContain("RIDER");
  });

  it("3. location:update — RIDER이면 성공 (Redis geoadd + riderLocation upsert 호출)", async () => {
    prismaMock.riderProfile.findUnique.mockResolvedValue({
      id: "rp-1",
      userId: "rider-1",
      transportType: "MOTORCYCLE",
      isOnline: true,
      totalDeliveries: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    prismaMock.riderLocation.upsert.mockResolvedValue({} as never);
    prismaMock.delivery.findFirst.mockResolvedValue(null);

    const req = makeRequest(
      {
        user: "rider-1",
        method: "location:update",
        data: { lat: 37.5, lng: 127.0 },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.success).toBe(true);
    expect(redisMock.geoadd).toHaveBeenCalledWith(
      "rider:locations",
      127.0,
      37.5,
      "rider-1"
    );
    expect(prismaMock.riderLocation.upsert).toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────
  // 4-5. delivery:status
  // ────────────────────────────────────────────────────────────
  it("4. delivery:status — ACCEPTED → AT_STORE 전이 성공", async () => {
    const mockDelivery = {
      id: "del-1",
      orderId: "order-1",
      riderId: "rider-1",
      status: "ACCEPTED",
      riderFee: 3000,
      order: {
        userId: "user-1",
        restaurant: { ownerId: "owner-1" },
      },
      pickupLat: 37.5,
      pickupLng: 127.0,
      dropoffLat: 37.51,
      dropoffLng: 127.01,
    };

    prismaMock.delivery.findUnique.mockResolvedValue(mockDelivery as never);
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
    prismaMock.delivery.update.mockResolvedValue({} as never);

    const req = makeRequest(
      {
        user: "rider-1",
        method: "delivery:status",
        data: { orderId: "order-1", status: "AT_STORE" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.success).toBe(true);
    expect(json.result.data.status).toBe("AT_STORE");
  });

  it("5. delivery:status — ACCEPTED → DONE 거부 (400, 유효하지 않은 전이)", async () => {
    const mockDelivery = {
      id: "del-1",
      orderId: "order-1",
      riderId: "rider-1",
      status: "ACCEPTED",
      riderFee: 3000,
      order: {
        userId: "user-1",
        restaurant: { ownerId: "owner-1" },
      },
    };

    prismaMock.delivery.findUnique.mockResolvedValue(mockDelivery as never);

    const req = makeRequest(
      {
        user: "rider-1",
        method: "delivery:status",
        data: { orderId: "order-1", status: "DONE" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(400);
    expect(json.error.message).toContain("ACCEPTED");
    expect(json.error.message).toContain("DONE");
  });

  // ────────────────────────────────────────────────────────────
  // 6. delivery:accept
  // ────────────────────────────────────────────────────────────
  it("6. delivery:accept — 정상 수락 ($transaction 성공)", async () => {
    // 진행 중인 배달 없음
    prismaMock.delivery.findFirst.mockResolvedValue(null);

    // 트랜잭션 내부 순서대로 mock
    const txMock = {
      order: { findUnique: prismaMock.order.findUnique, update: prismaMock.order.update },
      delivery: { updateMany: prismaMock.delivery.updateMany },
    };

    prismaMock.order.findUnique.mockResolvedValue({
      id: "order-1",
      status: "WAITING_RIDER",
    } as never);
    prismaMock.delivery.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.order.update.mockResolvedValue({} as never);

    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
      fn(prismaMock)
    );

    // delivery.findUnique (accept 후 publish용)
    prismaMock.delivery.findUnique.mockResolvedValue({
      id: "del-1",
      orderId: "order-1",
      riderId: "rider-1",
      status: "ACCEPTED",
      order: {
        userId: "user-1",
        restaurantId: "rest-1",
        restaurant: { ownerId: "owner-1" },
      },
    } as never);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "rider-1",
      nickname: "테스트기사",
      riderProfile: { transportType: "MOTORCYCLE" },
    } as never);

    const req = makeRequest(
      {
        user: "rider-1",
        method: "delivery:accept",
        data: { orderId: "order-1" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.success).toBe(true);
    expect(json.result.data.orderId).toBe("order-1");
    // findFirst → null (진행중 배달 없음), $transaction 호출 확인
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────
  // 7-8. message:send
  // ────────────────────────────────────────────────────────────
  it("7. message:send — 채팅 참여자이면 메시지 저장 후 성공", async () => {
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      userId: "user-1",
      adminId: "admin-1",
      type: "CUSTOMER_SUPPORT",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    prismaMock.message.create.mockResolvedValue({
      id: "msg-1",
      chatId: "chat-1",
      senderId: "user-1",
      type: "TEXT",
      content: "안녕하세요",
      isRead: false,
      createdAt: new Date(),
      sender: { nickname: "테스트유저" },
    } as never);

    prismaMock.chat.update.mockResolvedValue({} as never);

    const req = makeRequest(
      {
        user: "user-1",
        method: "message:send",
        data: { chatId: "chat-1", type: "TEXT", content: "안녕하세요" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.chatId).toBe("chat-1");
    expect(json.result.data.content).toBe("안녕하세요");
    expect(prismaMock.message.create).toHaveBeenCalled();
  });

  it("8. message:send — 비참여자이면 403", async () => {
    prismaMock.chat.findFirst.mockResolvedValue(null);

    const req = makeRequest(
      {
        user: "user-99",
        method: "message:send",
        data: { chatId: "chat-1", type: "TEXT", content: "안녕하세요" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
    expect(json.error.message).toContain("participant");
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });
});
