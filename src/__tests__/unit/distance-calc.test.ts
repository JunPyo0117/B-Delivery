import { describe, it, expect } from "vitest";
import { calculateDistance } from "@/shared/lib/utils";

describe("calculateDistance — Haversine 공식 검증", () => {
  it("동일 좌표 → 0km", () => {
    const result = calculateDistance(37.5665, 126.978, 37.5665, 126.978);
    expect(result).toBe(0);
  });

  it("서울 → 부산 약 325km (오차 5% 이내)", () => {
    // 서울 시청: 37.5665, 126.9780
    // 부산 시청: 35.1796, 129.0756
    const result = calculateDistance(37.5665, 126.978, 35.1796, 129.0756);
    const expected = 325;
    expect(result).toBeGreaterThan(expected * 0.95);
    expect(result).toBeLessThan(expected * 1.05);
  });

  it("강남역 → 서초역 약 2km (짧은 거리)", () => {
    // 강남역: 37.4979, 127.0276
    // 서초역: 37.4916, 127.0121
    const result = calculateDistance(37.4979, 127.0276, 37.4916, 127.0121);
    const expected = 1.5;
    // 약 1.5~2.5km 범위 내
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThan(3.0);
  });

  it("서울 → 뉴욕 약 11,000km (반구 반대편)", () => {
    // 서울 시청: 37.5665, 126.9780
    // 뉴욕 타임스퀘어: 40.7580, -73.9855
    const result = calculateDistance(37.5665, 126.978, 40.758, -73.9855);
    const expected = 11000;
    expect(result).toBeGreaterThan(expected * 0.95);
    expect(result).toBeLessThan(expected * 1.05);
  });

  it("결과는 항상 0 이상의 숫자", () => {
    const result = calculateDistance(0, 0, 1, 1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
  });

  it("대칭성: A→B 거리 = B→A 거리", () => {
    const ab = calculateDistance(37.5665, 126.978, 35.1796, 129.0756);
    const ba = calculateDistance(35.1796, 129.0756, 37.5665, 126.978);
    expect(ab).toBeCloseTo(ba, 6);
  });
});
