/**
 * GET /api/chat/orders 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { GET } from "@/app/api/chat/orders/route";

describe("GET /api/chat/orders", () => {
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("주문 목록이 없으면 빈 배열 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ id: "user-1" }));
    prismaMock.order.findMany.mockResolvedValue([]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual([]);
  });

  it("주문 목록을 ChatOrderItem 형태로 변환하여 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ id: "user-1" }));

    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        totalPrice: 15000,
        createdAt: new Date("2026-03-31T10:00:00Z"),
        restaurant: { name: "테스트식당", imageUrl: "http://img.jpg" },
        items: [
          { menu: { name: "김치찌개" } },
          { menu: { name: "된장찌개" } },
        ],
        chats: [{ id: "chat-1" }],
      },
    ] as never);

    const res = await GET();
    const json = await res.json();

    expect(json).toHaveLength(1);
    expect(json[0].orderId).toBe("order-1");
    expect(json[0].restaurantName).toBe("테스트식당");
    expect(json[0].itemSummary).toBe("김치찌개 외 1개");
    expect(json[0].chatId).toBe("chat-1");
    expect(json[0].totalPrice).toBe(15000);
  });

  it("아이템이 1개면 '외 N개' 없이 메뉴명만 표시", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ id: "user-1" }));

    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-2",
        totalPrice: 9000,
        createdAt: new Date("2026-03-31"),
        restaurant: { name: "식당", imageUrl: null },
        items: [{ menu: { name: "라면" } }],
        chats: [],
      },
    ] as never);

    const res = await GET();
    const json = await res.json();

    expect(json[0].itemSummary).toBe("라면");
    expect(json[0].chatId).toBeNull();
  });

  it("아이템이 없으면 '알 수 없는 메뉴' 표시", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ id: "user-1" }));

    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-3",
        totalPrice: 0,
        createdAt: new Date("2026-03-31"),
        restaurant: { name: "식당", imageUrl: null },
        items: [],
        chats: [],
      },
    ] as never);

    const res = await GET();
    const json = await res.json();

    expect(json[0].itemSummary).toBe("알 수 없는 메뉴");
  });
});
