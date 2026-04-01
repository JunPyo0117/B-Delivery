/**
 * POST /api/chat/token 테스트
 */
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-at-least-32-chars-long";

import { describe, it, expect, vi } from "vitest";
import { jwtVerify } from "jose";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { POST } from "@/app/api/chat/token/route";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

describe("POST /api/chat/token", () => {
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("USER 역할 → JWT에 order# 채널 포함", async () => {
    mockedAuth.mockResolvedValue(
      createMockSession({ id: "user-1", role: "USER", nickname: "고객" })
    );

    const res = await POST();
    const json = await res.json();

    expect(json.token).toBeDefined();

    const { payload } = await jwtVerify(json.token, secret);
    expect(payload.sub).toBe("user-1");
    expect((payload as Record<string, unknown>).channels).toContain("user#user-1");
    expect((payload as Record<string, unknown>).channels).toContain("order#user-1");
    expect((payload.info as Record<string, unknown>).role).toBe("USER");
    expect((payload.info as Record<string, unknown>).nickname).toBe("고객");
  });

  it("OWNER 역할 → JWT에 owner_orders# 채널 포함", async () => {
    mockedAuth.mockResolvedValue(
      createMockSession({ id: "owner-1", role: "OWNER", nickname: "사장" })
    );

    const res = await POST();
    const json = await res.json();
    const { payload } = await jwtVerify(json.token, secret);

    expect((payload as Record<string, unknown>).channels).toContain("owner_orders#owner-1");
    expect((payload as Record<string, unknown>).channels).not.toContain("order#owner-1");
  });

  it("RIDER 역할 → JWT에 delivery_requests# 채널 포함", async () => {
    mockedAuth.mockResolvedValue(
      createMockSession({ id: "rider-1", role: "RIDER", nickname: "기사" })
    );

    const res = await POST();
    const json = await res.json();
    const { payload } = await jwtVerify(json.token, secret);

    expect((payload as Record<string, unknown>).channels).toContain("delivery_requests#rider-1");
  });

  it("ADMIN 역할 → user# 채널만 포함", async () => {
    mockedAuth.mockResolvedValue(
      createMockSession({ id: "admin-1", role: "ADMIN", nickname: "관리자" })
    );

    const res = await POST();
    const json = await res.json();
    const { payload } = await jwtVerify(json.token, secret);

    expect((payload as Record<string, unknown>).channels).toEqual(["user#admin-1"]);
  });
});
