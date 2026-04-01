/**
 * Centrifugo Connect Proxy 테스트
 */
process.env.CENTRIFUGO_PROXY_SECRET = "test-secret";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-at-least-32-chars-long";

import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { POST } from "@/app/api/centrifugo/connect/route";

const PROXY_SECRET = "test-secret";
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

async function makeToken(sub: string, info?: { role: string; nickname: string }, exp = "2h") {
  const builder = new SignJWT({ info })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(exp);
  return builder.sign(secret);
}

function makeRequest(body: Record<string, unknown>, proxySecret?: string) {
  return new Request("http://localhost/api/centrifugo/connect", {
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

describe("POST /api/centrifugo/connect", () => {
  // ── 인증 ──
  it("Proxy Secret 불일치 시 403 반환", async () => {
    const req = makeRequest({ token: "any" }, "wrong-secret");
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(403);
  });

  it("토큰 미제공 시 401 반환", async () => {
    const req = makeRequest({}, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(401);
    expect(json.error.message).toContain("Token required");
  });

  it("유효하지 않은 토큰 시 401 반환", async () => {
    const req = makeRequest({ token: "invalid-jwt" }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();
    expect(json.error.code).toBe(401);
    expect(json.error.message).toContain("Invalid token");
  });

  // ── 역할별 채널 구독 ──
  it("USER 역할 → user# + order# 채널 구독 (subs 객체)", async () => {
    const token = await makeToken("user-1", { role: "USER", nickname: "고객" });
    const req = makeRequest({ token }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.user).toBe("user-1");
    expect(json.result.data.role).toBe("USER");
    expect(json.result.subs).toHaveProperty("user#user-1");
    expect(json.result.subs).toHaveProperty("order#user-1");
  });

  it("OWNER 역할 → user# + owner_orders# 채널 구독", async () => {
    const token = await makeToken("owner-1", { role: "OWNER", nickname: "사장" });
    const req = makeRequest({ token }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.subs).toHaveProperty("user#owner-1");
    expect(json.result.subs).toHaveProperty("owner_orders#owner-1");
    expect(json.result.subs).not.toHaveProperty("order#owner-1");
  });

  it("RIDER 역할 → user# + delivery_requests# 채널 구독", async () => {
    const token = await makeToken("rider-1", { role: "RIDER", nickname: "기사" });
    const req = makeRequest({ token }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.subs).toHaveProperty("user#rider-1");
    expect(json.result.subs).toHaveProperty("delivery_requests#rider-1");
  });

  it("ADMIN 역할 → user# 채널만 구독", async () => {
    const token = await makeToken("admin-1", { role: "ADMIN", nickname: "관리자" });
    const req = makeRequest({ token }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();

    expect(Object.keys(json.result.subs)).toEqual(["user#admin-1"]);
  });

  it("info 없는 토큰 → 기본 role=USER, nickname=빈문자열", async () => {
    const token = await makeToken("user-2", undefined);
    const req = makeRequest({ token }, PROXY_SECRET);
    const res = await POST(req);
    const json = await res.json();

    expect(json.result.data.role).toBe("USER");
    expect(json.result.data.nickname).toBe("");
    expect(json.result.subs).toHaveProperty("order#user-2");
  });
});
