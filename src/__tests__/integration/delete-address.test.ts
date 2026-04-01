import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("deleteAddress", () => {
  async function importDeleteAddress() {
    const { deleteAddress } = await import(
      "@/entities/user/api/deleteAddress"
    );
    return deleteAddress;
  }

  const existingAddress = {
    id: "addr-1",
    userId: "user-1",
    label: "집",
    address: "서울시 강남구",
    addressDetail: null,
    latitude: 37.5065,
    longitude: 127.0536,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("삭제 성공: 기본 주소가 아닌 주소를 삭제한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.delete.mockResolvedValue({} as any);

    const result = await deleteAddress("addr-1");

    expect(result).toEqual({ success: true });
    expect(prismaMock.userAddress.delete).toHaveBeenCalledWith({
      where: { id: "addr-1" },
    });
    // 기본 주소가 아니므로 User 업데이트 없음
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("기본 주소 삭제: 다음 주소를 기본 주소로 승격한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    const defaultAddress = { ...existingAddress, isDefault: true };
    const nextAddress = {
      id: "addr-2",
      address: "서울시 서초구",
      latitude: 37.49,
      longitude: 127.02,
    };

    prismaMock.userAddress.findFirst
      .mockResolvedValueOnce(defaultAddress as any) // 소유권 확인
      .mockResolvedValueOnce(nextAddress as any); // 다음 기본 주소

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.delete.mockResolvedValue({} as any);
    prismaMock.userAddress.update.mockResolvedValue({} as any);
    prismaMock.user.update.mockResolvedValue({} as any);

    const result = await deleteAddress("addr-1");

    expect(result).toEqual({ success: true });
    expect(prismaMock.userAddress.update).toHaveBeenCalledWith({
      where: { id: "addr-2" },
      data: { isDefault: true },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        defaultAddress: "서울시 서초구",
        latitude: 37.49,
        longitude: 127.02,
      },
    });
  });

  it("기본 주소 삭제 (남은 주소 없음): User의 기본 주소를 null로 초기화한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    const defaultAddress = { ...existingAddress, isDefault: true };

    prismaMock.userAddress.findFirst
      .mockResolvedValueOnce(defaultAddress as any)
      .mockResolvedValueOnce(null); // 남은 주소 없음

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.delete.mockResolvedValue({} as any);
    prismaMock.user.update.mockResolvedValue({} as any);

    const result = await deleteAddress("addr-1");

    expect(result).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        defaultAddress: null,
        latitude: null,
        longitude: null,
      },
    });
  });

  it("주소 없음: 존재하지 않는 주소는 실패한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(null);

    const result = await deleteAddress("nonexistent");

    expect(result).toEqual({
      success: false,
      error: "주소를 찾을 수 없습니다.",
    });
  });

  it("비인증 사용자: 로그인 없이 호출하면 실패한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await deleteAddress("addr-1");

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
  });

  it("트랜잭션 실패: DB 에러 시 실패 메시지를 반환한다", async () => {
    const deleteAddress = await importDeleteAddress();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockRejectedValue(new Error("DB error"));

    const result = await deleteAddress("addr-1");

    expect(result).toEqual({
      success: false,
      error: "주소 삭제에 실패했습니다.",
    });
  });
});
