import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth, mockedAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("updateAddress", () => {
  async function importUpdateAddress() {
    const { updateAddress } = await import(
      "@/entities/user/api/updateAddress"
    );
    return updateAddress;
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
  };

  it("수정 성공: 주소 라벨을 수정한다", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.update.mockResolvedValue({
      ...existingAddress,
      label: "회사",
    } as any);

    const result = await updateAddress({ id: "addr-1", label: "회사" });

    expect(result.success).toBe(true);
    expect(result.data?.label).toBe("회사");
  });

  it("기본 주소로 변경: isDefault true 시 기존 기본 주소 해제 및 User 업데이트", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.userAddress.update.mockResolvedValue({
      ...existingAddress,
      isDefault: true,
    } as any);
    prismaMock.user.update.mockResolvedValue({} as any);

    const result = await updateAddress({ id: "addr-1", isDefault: true });

    expect(result.success).toBe(true);
    expect(prismaMock.userAddress.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("기본 주소 아닌 수정: isDefault 미제공 시 User 업데이트 없음", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.update.mockResolvedValue(existingAddress as any);

    await updateAddress({ id: "addr-1", label: "새이름" });

    expect(prismaMock.userAddress.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("주소 없음: 존재하지 않는 주소는 실패한다", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(null);

    const result = await updateAddress({ id: "nonexistent", label: "집" });

    expect(result).toEqual({
      success: false,
      error: "주소를 찾을 수 없습니다.",
    });
  });

  it("비인증 사용자: 로그인 없이 호출하면 실패한다", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(null));

    const result = await updateAddress({ id: "addr-1", label: "집" });

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
  });

  it("트랜잭션 실패: DB 에러 시 실패 메시지를 반환한다", async () => {
    const updateAddress = await importUpdateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.userAddress.findFirst.mockResolvedValue(existingAddress as any);
    prismaMock.$transaction.mockRejectedValue(new Error("DB error"));

    const result = await updateAddress({ id: "addr-1", label: "새이름" });

    expect(result).toEqual({
      success: false,
      error: "주소 수정에 실패했습니다.",
    });
  });
});
