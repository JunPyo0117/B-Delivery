/**
 * POST /api/upload/presigned-url 테스트
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/shared/api/minio", () => ({
  getMinioClient: vi.fn(() => ({
    presignedPutObject: vi.fn().mockResolvedValue("http://minio:9000/bdelivery/test/uuid.webp?sig=abc"),
  })),
  MINIO_BUCKET: "bdelivery",
  getPublicUrl: vi.fn((key: string) => `http://cdn.example.com/${key}`),
  toPublicPresignedUrl: vi.fn((url: string) => url.replace("minio:9000", "localhost:9000")),
}));

import { createMockSession, mockedAuth } from "../helpers/auth-mock";
import { POST } from "@/app/api/upload/presigned-url/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/upload/presigned-url", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/upload/presigned-url", () => {
  // ── 인증 ──
  it("미인증 시 401 반환", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ category: "profile", contentType: "image/webp", fileSize: 1000 }));
    expect(res.status).toBe(401);
  });

  // ── 카테고리 검증 ──
  it("허용되지 않는 카테고리 → 400", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await POST(makeRequest({ category: "invalid", contentType: "image/webp", fileSize: 1000 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("카테고리");
  });

  // ── Content-Type 검증 ──
  it("허용되지 않는 contentType → 400", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await POST(makeRequest({ category: "profile", contentType: "application/pdf", fileSize: 1000 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("이미지");
  });

  // ── 파일 크기 검증 ──
  it("5MB 초과 → 400", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await POST(
      makeRequest({ category: "profile", contentType: "image/webp", fileSize: 6 * 1024 * 1024 })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("5MB");
  });

  it("fileSize가 숫자가 아니면 400", async () => {
    mockedAuth.mockResolvedValue(createMockSession());
    const res = await POST(
      makeRequest({ category: "profile", contentType: "image/webp", fileSize: "big" })
    );
    expect(res.status).toBe(400);
  });

  // ── 성공 ──
  it("유효한 요청 시 presigned URL 반환", async () => {
    mockedAuth.mockResolvedValue(createMockSession());

    const res = await POST(
      makeRequest({ category: "review", contentType: "image/jpeg", fileSize: 2000 })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.uploadUrl).toBeDefined();
    expect(json.objectKey).toMatch(/^review\//);
    expect(json.publicUrl).toBeDefined();
  });

  it("webp 확장자 올바르게 처리", async () => {
    mockedAuth.mockResolvedValue(createMockSession());

    const res = await POST(
      makeRequest({ category: "menu", contentType: "image/webp", fileSize: 1000 })
    );
    const json = await res.json();

    expect(json.objectKey).toMatch(/\.webp$/);
  });

  it("jpeg 확장자 올바르게 처리", async () => {
    mockedAuth.mockResolvedValue(createMockSession());

    const res = await POST(
      makeRequest({ category: "menu", contentType: "image/jpeg", fileSize: 1000 })
    );
    const json = await res.json();

    expect(json.objectKey).toMatch(/\.jpeg$/);
  });

  // ── 허용된 카테고리들 ──
  for (const category of ["profile", "restaurant", "menu", "review", "chat"]) {
    it(`카테고리 '${category}' 허용`, async () => {
      mockedAuth.mockResolvedValue(createMockSession());
      const res = await POST(
        makeRequest({ category, contentType: "image/png", fileSize: 1000 })
      );
      expect(res.status).toBe(200);
    });
  }
});
