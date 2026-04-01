/**
 * POST /api/chat/create 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { createMockSession } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { POST } from "@/app/api/chat/create/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat/create", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/chat/create", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(makeRequest({ orderId: "order-1" }));
    expect(res.status).toBe(401);
  });

  // ── 유효성 ──
  it("orderId 미제공 시 400 반환", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession());
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  // ── 주문 검증 ──
  it("주문을 찾을 수 없으면 404 반환", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession());
    prismaMock.order.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ orderId: "order-999" }));
    expect(res.status).toBe(404);
  });

  // ── 일반 사용자: 기존 채팅 반환 ──
  it("기존 채팅이 있으면 해당 chatId 반환", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1" }));
    prismaMock.order.findFirst.mockResolvedValue({
      id: "order-1",
      chats: [{ id: "chat-existing" }],
    } as never);
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-existing" } as never);

    const res = await POST(makeRequest({ orderId: "order-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.chatId).toBe("chat-existing");
  });

  // ── 일반 사용자: 새 채팅 생성 (ADMIN 자동 배정) ──
  it("사용 가능한 ADMIN이 있으면 IN_PROGRESS로 생성", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1", role: "USER" }));
    prismaMock.order.findFirst.mockResolvedValue({
      id: "order-1",
      chats: [],
    } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({ id: "admin-1" } as never);
    prismaMock.chat.create.mockResolvedValue({ id: "chat-new" } as never);
    prismaMock.message.create.mockResolvedValue({} as never);

    const res = await POST(makeRequest({ orderId: "order-1" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.chatId).toBe("chat-new");
    expect(prismaMock.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          adminId: "admin-1",
          chatType: "CUSTOMER_SUPPORT",
        }),
      })
    );
  });

  it("사용 가능한 ADMIN이 없으면 WAITING으로 생성", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1", role: "USER" }));
    prismaMock.order.findFirst.mockResolvedValue({
      id: "order-1",
      chats: [],
    } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null); // ADMIN 없음
    prismaMock.chat.create.mockResolvedValue({ id: "chat-waiting" } as never);
    prismaMock.message.create.mockResolvedValue({} as never);

    const res = await POST(makeRequest({ orderId: "order-1" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.chatId).toBe("chat-waiting");
    expect(prismaMock.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "WAITING",
          adminId: null,
        }),
      })
    );
  });

  // ── 역할별 chatType ──
  it("OWNER가 생성 시 chatType=OWNER_SUPPORT", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1", chats: [] } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.chat.create.mockResolvedValue({ id: "chat-owner" } as never);
    prismaMock.message.create.mockResolvedValue({} as never);

    await POST(makeRequest({ orderId: "order-1" }));

    expect(prismaMock.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ chatType: "OWNER_SUPPORT" }),
      })
    );
  });

  it("RIDER가 생성 시 chatType=RIDER_SUPPORT", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "rider-1", role: "RIDER" }));
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1", chats: [] } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.chat.create.mockResolvedValue({ id: "chat-rider" } as never);
    prismaMock.message.create.mockResolvedValue({} as never);

    await POST(makeRequest({ orderId: "order-1" }));

    expect(prismaMock.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ chatType: "RIDER_SUPPORT" }),
      })
    );
  });

  // ── ADMIN: targetUserId로 채팅 ──
  it("ADMIN이 targetUserId로 기존 채팅 반환", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "admin-1", role: "ADMIN" }));
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1", chats: [] } as never);
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-existing" } as never);

    const res = await POST(makeRequest({ orderId: "order-1", targetUserId: "user-1" }));
    const json = await res.json();

    expect(json.chatId).toBe("chat-existing");
  });

  it("ADMIN이 targetUserId로 새 채팅 생성 (OWNER 대상)", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "admin-1", role: "ADMIN" }));
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1", chats: [] } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ role: "OWNER" } as never);
    prismaMock.chat.create.mockResolvedValue({ id: "chat-admin-new" } as never);
    prismaMock.message.create.mockResolvedValue({} as never);

    const res = await POST(makeRequest({ orderId: "order-1", targetUserId: "owner-1" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.chatId).toBe("chat-admin-new");
    expect(prismaMock.chat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chatType: "OWNER_SUPPORT",
          adminId: "admin-1",
          status: "IN_PROGRESS",
        }),
      })
    );
  });

  it("ADMIN이 존재하지 않는 targetUserId로 요청 시 404", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "admin-1", role: "ADMIN" }));
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1", chats: [] } as never);
    prismaMock.chat.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ orderId: "order-1", targetUserId: "no-user" }));
    expect(res.status).toBe(404);
  });
});
