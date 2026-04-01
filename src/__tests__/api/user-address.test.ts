/**
 * GET /api/user/address 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { GET } from "@/app/api/user/address/route";

describe("GET /api/user/address", () => {
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("주소가 설정되어 있으면 주소 반환", async () => {
    const session = createMockSession();
    (session.user as unknown as Record<string, unknown>).defaultAddress = "서울시 강남구 역삼동";
    mockedAuth.mockResolvedValue(session as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.address).toBe("서울시 강남구 역삼동");
  });

  it("주소가 미설정이면 null 반환", async () => {
    const session = createMockSession();
    (session.user as unknown as Record<string, unknown>).defaultAddress = null;
    mockedAuth.mockResolvedValue(session as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.address).toBeNull();
  });

  it("defaultAddress가 undefined이면 null 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.address).toBeNull();
  });
});
