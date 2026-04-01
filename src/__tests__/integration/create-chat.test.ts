import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";
import { CHAT, ORDER } from "../helpers/fixtures";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { createChat } from "@/features/chat/api/createChat";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createChat", () => {
  it("비인증 사용자: 로그인 없으면 에러를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await createChat({});

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  });

  it("orderId 없이 채팅을 생성한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.create.mockResolvedValue({ id: "chat-new" } as any);

    const result = await createChat({ category: "일반문의" });

    expect(result).toEqual({ success: true, chatId: "chat-new" });
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
      data: {
        chatType: "CUSTOMER_SUPPORT",
        userId: "user-1",
        orderId: null,
        category: "일반문의",
      },
    });
  });

  it("orderId가 있으면 주문 소유를 확인한 후 채팅을 생성한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.order.findFirst.mockResolvedValue({ id: ORDER.id } as any);
    prismaMock.chat.create.mockResolvedValue({ id: "chat-order" } as any);

    const result = await createChat({
      orderId: ORDER.id,
      category: "주문문의",
    });

    expect(result).toEqual({ success: true, chatId: "chat-order" });
    expect(prismaMock.order.findFirst).toHaveBeenCalledWith({
      where: { id: ORDER.id, userId: "user-1" },
      select: { id: true },
    });
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
      data: {
        chatType: "CUSTOMER_SUPPORT",
        userId: "user-1",
        orderId: ORDER.id,
        category: "주문문의",
      },
    });
  });

  it("orderId가 있지만 주문을 찾을 수 없으면 에러를 반환한다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.order.findFirst.mockResolvedValue(null);

    const result = await createChat({ orderId: "non-existent-order" });

    expect(result).toEqual({
      success: false,
      error: "주문을 찾을 수 없습니다.",
    });
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  });

  it("category 없이 생성하면 null로 저장된다", async () => {
    vi.mocked(auth).mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.chat.create.mockResolvedValue({ id: "chat-no-cat" } as any);

    const result = await createChat({});

    expect(result).toEqual({ success: true, chatId: "chat-no-cat" });
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
      data: {
        chatType: "CUSTOMER_SUPPORT",
        userId: "user-1",
        orderId: null,
        category: null,
      },
    });
  });
});
