import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("getAddresses", () => {
  async function importGetAddresses() {
    const { getAddresses } = await import(
      "@/entities/user/api/getAddresses"
    );
    return getAddresses;
  }

  it("주소 목록 조회 성공: 주소를 매핑하여 반환한다", async () => {
    const getAddresses = await importGetAddresses();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    const dbAddresses = [
      {
        id: "addr-1",
        label: "집",
        address: "서울시 강남구",
        addressDetail: "101호",
        latitude: 37.5065,
        longitude: 127.0536,
        isDefault: true,
      },
      {
        id: "addr-2",
        label: "회사",
        address: "서울시 서초구",
        addressDetail: null,
        latitude: 37.49,
        longitude: 127.02,
        isDefault: false,
      },
    ];

    prismaMock.userAddress.findMany.mockResolvedValue(dbAddresses as any);

    const result = await getAddresses();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "addr-1",
      label: "집",
      address: "서울시 강남구",
      detail: "101호",
      latitude: 37.5065,
      longitude: 127.0536,
      isDefault: true,
    });
    expect(result[1].detail).toBeNull();
  });

  it("정렬 확인: isDefault desc, createdAt desc 순서로 조회한다", async () => {
    const getAddresses = await importGetAddresses();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findMany.mockResolvedValue([]);

    await getAddresses();

    expect(prismaMock.userAddress.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    );
  });

  it("비인증 사용자: 로그인 없이 호출하면 빈 배열을 반환한다", async () => {
    const getAddresses = await importGetAddresses();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await getAddresses();

    expect(result).toEqual([]);
    expect(prismaMock.userAddress.findMany).not.toHaveBeenCalled();
  });

  it("주소 없음: 주소가 없으면 빈 배열을 반환한다", async () => {
    const getAddresses = await importGetAddresses();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findMany.mockResolvedValue([]);

    const result = await getAddresses();

    expect(result).toEqual([]);
  });
});
