/**
 * PROXY_SECRET은 route.ts 모듈 최상위에서 process.env를 읽어 고정됩니다.
 * import 전에 env를 설정해야 올바르게 반영됩니다.
 */
process.env.CENTRIFUGO_PROXY_SECRET = "test-secret";

import { describe, it, expect } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { POST } from "@/app/api/centrifugo/subscribe/route";

const PROXY_SECRET = "test-secret";

function makeRequest(body: Record<string, unknown>, secret?: string) {
  return new Request("http://localhost/api/centrifugo/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(secret !== undefined ? { "X-Centrifugo-Proxy-Secret": secret } : {}),
    },
  });
}

describe("POST /api/centrifugo/subscribe", () => {

  it("1. Proxy Secret 없으면 403 반환", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "chat:abc" },
      "wrong-secret"
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
  });

  it("2. chat: 채널 — 참여자이면 구독 허용", async () => {
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      userId: "user-1",
      adminId: "admin-1",
      type: "CUSTOMER_SUPPORT",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const req = makeRequest(
      { user: "user-1", channel: "chat:chat-1" },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result).toBeDefined();
    expect(json.error).toBeUndefined();
    expect(prismaMock.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "chat-1" }),
      })
    );
  });

  it("3. chat: 채널 — 비참여자(findFirst null)이면 403", async () => {
    prismaMock.chat.findFirst.mockResolvedValue(null);

    const req = makeRequest(
      { user: "user-99", channel: "chat:chat-1" },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
    expect(json.error.message).toBe("Not a chat participant");
  });

  it("4. order#userId — 본인 채널 구독 가능", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "order#user-1" },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.result).toBeDefined();
    expect(json.error).toBeUndefined();
  });

  it("5. order#otherUser — 타인 채널 구독 거부 (403)", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "order#user-2" },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
    expect(json.error.message).toBe("Not channel owner");
  });

  it("6. 허용되지 않은 채널 패턴 거부 (403)", async () => {
    const req = makeRequest(
      { user: "user-1", channel: "unknown:channel" },
      PROXY_SECRET
    );
    const res = await POST(req);
    const json = await res.json();

    expect(json.error.code).toBe(403);
    expect(json.error.message).toBe("Subscribe not allowed");
  });
});
