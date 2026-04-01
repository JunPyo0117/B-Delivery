import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { getChatMessages } from "@/features/chat/api/getChatMessages";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMessage(id: string, createdAt: Date) {
  return {
    id,
    chatId: "chat-1",
    type: "TEXT",
    content: `메시지 ${id}`,
    isRead: false,
    createdAt,
    sender: { id: "sender-1", nickname: "테스트유저" },
  };
}

describe("getChatMessages", () => {
  it("비인증 사용자: 빈 결과를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await getChatMessages("chat-1");

    expect(result).toEqual({ messages: [], nextCursor: null });
  });

  it("채팅방 소유자가 아니면 빈 결과를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue(null);

    const result = await getChatMessages("chat-other");

    expect(result).toEqual({ messages: [], nextCursor: null });
    expect(prismaMock.chat.findFirst).toHaveBeenCalledWith({
      where: { id: "chat-other", userId: "user-1" },
      select: { id: true },
    });
  });

  it("메시지를 오래된 순으로 정렬하여 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as any);

    const t1 = new Date("2026-03-31T10:00:00Z");
    const t2 = new Date("2026-03-31T10:01:00Z");
    const t3 = new Date("2026-03-31T10:02:00Z");

    // DB에서는 desc로 반환됨 (t3, t2, t1)
    prismaMock.message.findMany.mockResolvedValue([
      makeMessage("msg-3", t3),
      makeMessage("msg-2", t2),
      makeMessage("msg-1", t1),
    ] as any);

    const result = await getChatMessages("chat-1");

    expect(result.messages).toHaveLength(3);
    // 오래된 순으로 뒤집힘
    expect(result.messages[0].id).toBe("msg-1");
    expect(result.messages[1].id).toBe("msg-2");
    expect(result.messages[2].id).toBe("msg-3");
    expect(result.nextCursor).toBeNull();
  });

  it("PAGE_SIZE(50)보다 많으면 hasMore = true, nextCursor를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as any);

    // 51개 메시지 생성 (PAGE_SIZE + 1)
    const messages = Array.from({ length: 51 }, (_, i) => {
      const date = new Date(`2026-03-31T10:${String(i).padStart(2, "0")}:00Z`);
      return makeMessage(`msg-${50 - i}`, date);
    });

    prismaMock.message.findMany.mockResolvedValue(messages as any);

    const result = await getChatMessages("chat-1");

    expect(result.messages).toHaveLength(50);
    expect(result.nextCursor).not.toBeNull();
  });

  it("cursor가 있으면 해당 시점 이전 메시지를 조회한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as any);
    prismaMock.message.findMany.mockResolvedValue([] as any);

    const cursor = "2026-03-31T09:00:00.000Z";
    await getChatMessages("chat-1", cursor);

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chatId: "chat-1",
          createdAt: { lt: new Date(cursor) },
        },
      })
    );
  });

  it("cursor가 없으면 createdAt 조건 없이 조회한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as any);
    prismaMock.message.findMany.mockResolvedValue([] as any);

    await getChatMessages("chat-1");

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chatId: "chat-1" },
      })
    );
  });

  it("메시지 응답 포맷이 올바르다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1" } as any);

    const t = new Date("2026-03-31T10:00:00Z");
    prismaMock.message.findMany.mockResolvedValue([
      {
        id: "msg-1",
        chatId: "chat-1",
        type: "IMAGE",
        content: "https://img.example.com/photo.jpg",
        isRead: true,
        createdAt: t,
        sender: { id: "sender-1", nickname: "닉네임" },
      },
    ] as any);

    const result = await getChatMessages("chat-1");

    expect(result.messages[0]).toEqual({
      id: "msg-1",
      chatId: "chat-1",
      senderId: "sender-1",
      nickname: "닉네임",
      type: "IMAGE",
      content: "https://img.example.com/photo.jpg",
      isRead: true,
      createdAt: t.toISOString(),
    });
  });
});
