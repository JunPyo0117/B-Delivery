/**
 * GET /api/chat/[chatId]/messages 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { GET } from "@/app/api/chat/[chatId]/messages/route";
import { NextRequest } from "next/server";

function makeRequest(chatId: string, params?: Record<string, string>) {
  const url = new URL(`http://localhost/api/chat/${chatId}/messages`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

function makeParams(chatId: string) {
  return { params: Promise.resolve({ chatId }) };
}

describe("GET /api/chat/[chatId]/messages", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(makeRequest("chat-1"), makeParams("chat-1"));
    expect(res.status).toBe(401);
  });

  // ── 채팅방 접근 ──
  it("채팅방을 찾을 수 없으면 404 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.chat.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest("chat-999"), makeParams("chat-999"));
    expect(res.status).toBe(404);
  });

  // ── ADMIN 접근 ──
  it("ADMIN은 모든 채팅방에 접근 가능", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ role: "ADMIN", id: "admin-1" }));
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);
    prismaMock.message.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest("chat-1"), makeParams("chat-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.messages).toEqual([]);
    // ADMIN 조건: where에 OR 없이 id만으로 조회
    expect(prismaMock.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "chat-1" } })
    );
  });

  // ── 일반 유저 접근 ──
  it("일반 유저는 참여한 채팅방만 접근 가능", async () => {
    mockedAuth.mockResolvedValue(createMockSession({ id: "user-1" }));
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);
    prismaMock.message.findMany.mockResolvedValue([]);

    await GET(makeRequest("chat-1"), makeParams("chat-1"));

    expect(prismaMock.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "chat-1",
          OR: expect.arrayContaining([
            { userId: "user-1" },
            { adminId: "user-1" },
          ]),
        }),
      })
    );
  });

  // ── 메시지 페이지네이션 ──
  it("메시지 목록을 반환하고 커서 기반 페이지네이션 지원", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);

    const now = new Date("2026-03-31T10:00:00Z");
    const messages = [
      {
        id: "msg-1",
        chatId: "chat-1",
        senderId: "user-1",
        type: "TEXT",
        content: "안녕",
        isRead: false,
        createdAt: now,
        sender: { id: "user-1", nickname: "테스트" },
      },
    ];
    prismaMock.message.findMany.mockResolvedValue(messages as never);

    const res = await GET(makeRequest("chat-1"), makeParams("chat-1"));
    const json = await res.json();

    expect(json.messages).toHaveLength(1);
    expect(json.messages[0].id).toBe("msg-1");
    expect(json.nextCursor).toBeNull();
  });

  it("hasMore가 true이면 nextCursor 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);

    // limit 기본값 50 → 51개 반환하면 hasMore=true
    const msgs = Array.from({ length: 51 }, (_, i) => ({
      id: `msg-${i}`,
      chatId: "chat-1",
      senderId: "user-1",
      type: "TEXT",
      content: `msg ${i}`,
      isRead: false,
      createdAt: new Date(`2026-03-31T10:${String(i).padStart(2, "0")}:00Z`),
      sender: { id: "user-1", nickname: "테스트" },
    }));
    prismaMock.message.findMany.mockResolvedValue(msgs as never);

    const res = await GET(makeRequest("chat-1"), makeParams("chat-1"));
    const json = await res.json();

    expect(json.messages).toHaveLength(50);
    expect(json.nextCursor).not.toBeNull();
  });

  it("limit 파라미터를 100까지 제한", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);
    prismaMock.message.findMany.mockResolvedValue([]);

    await GET(makeRequest("chat-1", { limit: "200" }), makeParams("chat-1"));

    // take = min(200, 100) + 1 = 101
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 101 })
    );
  });

  it("cursor 파라미터로 이전 메시지 조회", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as never);
    prismaMock.message.findMany.mockResolvedValue([]);

    const cursorDate = "2026-03-31T10:00:00.000Z";
    await GET(makeRequest("chat-1", { cursor: cursorDate }), makeParams("chat-1"));

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          chatId: "chat-1",
          createdAt: { lt: new Date(cursorDate) },
        }),
      })
    );
  });
});
