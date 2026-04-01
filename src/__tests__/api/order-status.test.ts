/**
 * PATCH /api/orders/[id]/status 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { createMockSession } from "../helpers/auth-mock";
import { prismaMock } from "../helpers/prisma-mock";
import { publishOrderUpdate } from "@/shared/api/redis";
import { PATCH } from "@/app/api/orders/[id]/status/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/orders/order-1/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const baseOrder = {
  id: "order-1",
  userId: "user-1",
  status: "PENDING",
  restaurant: { ownerId: "owner-1" },
};

describe("PATCH /api/orders/[id]/status", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    expect(res.status).toBe(401);
  });

  // ── 유효성 검사 ──
  it("유효하지 않은 상태 값 → 400", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    const res = await PATCH(makeRequest({ status: "INVALID" }), makeParams("order-1"));
    expect(res.status).toBe(400);
  });

  it("status 미제공 → 400", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    const res = await PATCH(makeRequest({}), makeParams("order-1"));
    expect(res.status).toBe(400);
  });

  // ── 주문 조회 ──
  it("주문을 찾을 수 없으면 404", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-999"));
    expect(res.status).toBe(404);
  });

  // ── USER 권한 ──
  it("USER: 본인 주문이 아니면 403", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-2", role: "USER" }));
    prismaMock.order.findUnique.mockResolvedValue(baseOrder as never);

    const res = await PATCH(makeRequest({ status: "CANCELLED" }), makeParams("order-1"));
    expect(res.status).toBe(403);
  });

  it("USER: CANCELLED 외의 상태로 전이 시도 시 403", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1", role: "USER" }));
    prismaMock.order.findUnique.mockResolvedValue(baseOrder as never);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    expect(res.status).toBe(403);
  });

  it("USER: PICKED_UP 상태에서 취소 시도 시 400", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1", role: "USER" }));
    prismaMock.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: "PICKED_UP",
    } as never);

    const res = await PATCH(makeRequest({ status: "CANCELLED" }), makeParams("order-1"));
    expect(res.status).toBe(400);
  });

  // ── OWNER 권한 ──
  it("OWNER: 다른 사장의 음식점 주문에 대해 403", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-2", role: "OWNER" }));
    prismaMock.order.findUnique.mockResolvedValue(baseOrder as never);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    expect(res.status).toBe(403);
  });

  // ── 상태 전이 검증 ──
  it("허용되지 않는 상태 전이 시 400", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    prismaMock.order.findUnique.mockResolvedValue(baseOrder as never);

    // PENDING → DONE 은 허용 안됨
    const res = await PATCH(makeRequest({ status: "DONE" }), makeParams("order-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("PENDING");
    expect(json.error).toContain("DONE");
  });

  // ── 낙관적 잠금 실패 ──
  it("동시 수정 시 409 반환", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    prismaMock.order.findUnique.mockResolvedValue(baseOrder as never);
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 } as never);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    expect(res.status).toBe(409);
  });

  // ── 성공 ──
  it("OWNER: PENDING → COOKING 전이 성공", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "owner-1", role: "OWNER" }));
    prismaMock.order.findUnique.mockResolvedValueOnce(baseOrder as never);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 } as never);

    const updatedOrder = { ...baseOrder, status: "COOKING", items: [], restaurant: { name: "식당" } };
    prismaMock.order.findUnique.mockResolvedValueOnce(updatedOrder as never);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("COOKING");
    expect(publishOrderUpdate).toHaveBeenCalledWith("order-1", "COOKING", "user-1", "owner-1");
  });

  it("USER: PENDING → CANCELLED 전이 성공", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "user-1", role: "USER" }));
    prismaMock.order.findUnique.mockResolvedValueOnce(baseOrder as never);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 } as never);

    const updatedOrder = { ...baseOrder, status: "CANCELLED", items: [], restaurant: { name: "식당" } };
    prismaMock.order.findUnique.mockResolvedValueOnce(updatedOrder as never);

    const res = await PATCH(makeRequest({ status: "CANCELLED" }), makeParams("order-1"));
    expect(res.status).toBe(200);
  });

  it("ADMIN은 모든 주문에 대해 상태 변경 가능", async () => {
    vi.mocked(auth).mockResolvedValue(createMockSession({ id: "admin-1", role: "ADMIN" }));
    prismaMock.order.findUnique.mockResolvedValueOnce(baseOrder as never);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 } as never);

    const updatedOrder = { ...baseOrder, status: "COOKING", items: [], restaurant: { name: "식당" } };
    prismaMock.order.findUnique.mockResolvedValueOnce(updatedOrder as never);

    const res = await PATCH(makeRequest({ status: "COOKING" }), makeParams("order-1"));
    expect(res.status).toBe(200);
  });
});
