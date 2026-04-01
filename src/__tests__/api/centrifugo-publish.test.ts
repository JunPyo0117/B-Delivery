/**
 * Centrifugo Publish Proxy 테스트
 */
process.env.CENTRIFUGO_PROXY_SECRET = "test-secret";

import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { POST } from "@/app/api/centrifugo/publish/route";
import { publish } from "@/shared/api/centrifugo";

const PROXY_SECRET = "test-secret";

function makeRequest(body: Record<string, unknown>, proxySecret?: string) {
  return new Request("http://localhost/api/centrifugo/publish", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(proxySecret !== undefined
        ? { "X-Centrifugo-Proxy-Secret": proxySecret }
        : {}),
    },
  });
}

describe("POST /api/centrifugo/publish", () => {
  // ── 인증 ──
  it("Proxy Secret 불일치 시 403 반환", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "chat:chat-1", data: { type: "TEXT", content: "Hi" } },
      "wrong-secret"
    );
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(403);
  });

  // ── 채널 검증 ──
  it("chat: 프리픽스가 아닌 채널 → 400", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "order:order-1", data: { type: "TEXT", content: "Hi" } },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(400);
    expect(json.error.message).toContain("not allowed");
  });

  // ── 참여자 검증 ──
  it("채팅 비참여자 → 403", async () => {
    prismaMock.chat.findFirst.mockResolvedValue(null);

    const req = makeRequest(
      { user: "user-99", channel: "chat:chat-1", data: { type: "TEXT", content: "Hi" } },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(403);
    expect(json.error.message).toContain("Not a chat participant");
  });

  // ── 성공 ──
  it("참여자이면 메시지 저장 후 enrichedMessage 반환", async () => {
    const now = new Date();
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      userId: "user-1",
      adminId: "admin-1",
    } as never);

    prismaMock.message.create.mockResolvedValue({
      id: "msg-1",
      chatId: "chat-1",
      senderId: "user-1",
      type: "TEXT",
      content: "안녕하세요",
      isRead: false,
      createdAt: now,
      sender: { nickname: "테스트유저" },
    } as never);

    prismaMock.chat.update.mockResolvedValue({} as never);

    const req = makeRequest(
      {
        user: "user-1",
        channel: "chat:chat-1",
        data: { type: "TEXT", content: "안녕하세요", _tempId: "temp-1" },
      },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.id).toBe("msg-1");
    expect(json.result.data.content).toBe("안녕하세요");
    expect(json.result.data._tempId).toBe("temp-1");
    expect(json.result.data.nickname).toBe("테스트유저");
    expect(prismaMock.message.create).toHaveBeenCalled();
    expect(prismaMock.chat.update).toHaveBeenCalled();
  });

  it("수신자 개인 채널에 알림 발행 (userId가 보낸 경우 adminId에게)", async () => {
    const now = new Date();
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      userId: "user-1",
      adminId: "admin-1",
    } as never);

    prismaMock.message.create.mockResolvedValue({
      id: "msg-2",
      chatId: "chat-1",
      senderId: "user-1",
      type: "TEXT",
      content: "테스트",
      isRead: false,
      createdAt: now,
      sender: { nickname: "유저" },
    } as never);
    prismaMock.chat.update.mockResolvedValue({} as never);

    const req = makeRequest(
      { user: "user-1", channel: "chat:chat-1", data: { type: "TEXT", content: "테스트" } },
      PROXY_SECRET
    );
    await POST(req);

    expect(publish).toHaveBeenCalledWith(
      "user#admin-1",
      expect.objectContaining({ type: "message:new" })
    );
  });

  it("admin이 보낸 경우 userId에게 알림 발행", async () => {
    const now = new Date();
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      userId: "user-1",
      adminId: "admin-1",
    } as never);

    prismaMock.message.create.mockResolvedValue({
      id: "msg-3",
      chatId: "chat-1",
      senderId: "admin-1",
      type: "TEXT",
      content: "응답",
      isRead: false,
      createdAt: now,
      sender: { nickname: "관리자" },
    } as never);
    prismaMock.chat.update.mockResolvedValue({} as never);

    const req = makeRequest(
      { user: "admin-1", channel: "chat:chat-1", data: { type: "TEXT", content: "응답" } },
      PROXY_SECRET
    );
    await POST(req);

    expect(publish).toHaveBeenCalledWith(
      "user#user-1",
      expect.objectContaining({ type: "message:new" })
    );
  });
});
