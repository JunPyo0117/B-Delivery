import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { getChatList } from "@/features/chat/api/getChatList";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getChatList", () => {
  it("비인증 사용자: 빈 배열을 반환한다", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await getChatList();

    expect(result).toEqual([]);
    expect(prismaMock.chat.findMany).not.toHaveBeenCalled();
  });

  it("채팅 목록을 올바르게 매핑한다 (텍스트 메시지)", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    const now = new Date("2026-03-31T10:00:00Z");
    prismaMock.chat.findMany.mockResolvedValue([
      {
        id: "chat-1",
        chatType: "CUSTOMER_SUPPORT",
        status: "ACTIVE",
        category: "주문문의",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            content: "안녕하세요",
            createdAt: now,
            type: "TEXT",
          },
        ],
        _count: { messages: 3 },
      },
    ] as any);

    const result = await getChatList();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "chat-1",
      chatType: "CUSTOMER_SUPPORT",
      status: "ACTIVE",
      category: "주문문의",
      lastMessage: "안녕하세요",
      lastMessageAt: now.toISOString(),
      unreadCount: 3,
      createdAt: now.toISOString(),
    });
  });

  it("이미지 메시지인 경우 '사진을 보냈습니다'로 표시한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    const now = new Date("2026-03-31T10:00:00Z");
    prismaMock.chat.findMany.mockResolvedValue([
      {
        id: "chat-2",
        chatType: "CUSTOMER_SUPPORT",
        status: "ACTIVE",
        category: null,
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            content: "https://img.example.com/photo.jpg",
            createdAt: now,
            type: "IMAGE",
          },
        ],
        _count: { messages: 0 },
      },
    ] as any);

    const result = await getChatList();

    expect(result[0].lastMessage).toBe("사진을 보냈습니다");
  });

  it("메시지가 없는 채팅은 lastMessage가 null이다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    const now = new Date("2026-03-31T10:00:00Z");
    prismaMock.chat.findMany.mockResolvedValue([
      {
        id: "chat-3",
        chatType: "CUSTOMER_SUPPORT",
        status: "ACTIVE",
        category: null,
        createdAt: now,
        updatedAt: now,
        messages: [],
        _count: { messages: 0 },
      },
    ] as any);

    const result = await getChatList();

    expect(result[0].lastMessage).toBeNull();
    expect(result[0].lastMessageAt).toBeNull();
    expect(result[0].unreadCount).toBe(0);
  });

  it("여러 채팅을 올바르게 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );

    const now = new Date("2026-03-31T10:00:00Z");
    prismaMock.chat.findMany.mockResolvedValue([
      {
        id: "chat-a",
        chatType: "CUSTOMER_SUPPORT",
        status: "ACTIVE",
        category: "배달문의",
        createdAt: now,
        updatedAt: now,
        messages: [{ content: "첫번째", createdAt: now, type: "TEXT" }],
        _count: { messages: 1 },
      },
      {
        id: "chat-b",
        chatType: "CUSTOMER_SUPPORT",
        status: "CLOSED",
        category: null,
        createdAt: now,
        updatedAt: now,
        messages: [],
        _count: { messages: 0 },
      },
    ] as any);

    const result = await getChatList();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("chat-a");
    expect(result[1].id).toBe("chat-b");
  });
});
