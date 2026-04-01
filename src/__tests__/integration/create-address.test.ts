import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth, mockedAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("createAddress", () => {
  async function importCreateAddress() {
    const { createAddress } = await import(
      "@/entities/user/api/createAddress"
    );
    return createAddress;
  }

  const validInput = {
    label: "집",
    address: "서울시 강남구 테헤란로 123",
    detail: "101호",
    latitude: 37.5065,
    longitude: 127.0536,
    isDefault: false,
  };

  const mockAddressResult = {
    id: "addr-1",
    label: "집",
    address: "서울시 강남구 테헤란로 123",
    addressDetail: "101호",
    latitude: 37.5065,
    longitude: 127.0536,
    isDefault: false,
  };

  it("주소 추가 성공: 기본 주소가 아닌 경우", async () => {
    const createAddress = await importCreateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.create.mockResolvedValue(mockAddressResult as any);

    const result = await createAddress(validInput);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "addr-1",
      label: "집",
      address: "서울시 강남구 테헤란로 123",
      detail: "101호",
      latitude: 37.5065,
      longitude: 127.0536,
      isDefault: false,
    });
    expect(prismaMock.userAddress.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("기본 주소 설정: isDefault true일 때 기존 기본 주소를 해제하고 User도 업데이트한다", async () => {
    const createAddress = await importCreateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.userAddress.create.mockResolvedValue({
      ...mockAddressResult,
      isDefault: true,
    } as any);
    prismaMock.user.update.mockResolvedValue({} as any);

    const result = await createAddress({ ...validInput, isDefault: true });

    expect(result.success).toBe(true);
    expect(prismaMock.userAddress.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        defaultAddress: validInput.address,
        latitude: validInput.latitude,
        longitude: validInput.longitude,
      },
    });
  });

  it("비인증 사용자: 로그인 없이 호출하면 실패한다", async () => {
    const createAddress = await importCreateAddress();
    mockedAuth.mockImplementation(mockAuth(null));

    const result = await createAddress(validInput);

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
  });

  it("트랜잭션 실패: DB 에러 시 실패 메시지를 반환한다", async () => {
    const createAddress = await importCreateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.$transaction.mockRejectedValue(new Error("DB error"));

    const result = await createAddress(validInput);

    expect(result).toEqual({
      success: false,
      error: "주소 추가에 실패했습니다.",
    });
  });

  it("detail 미제공: detail이 없으면 addressDetail이 null로 저장된다", async () => {
    const createAddress = await importCreateAddress();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock)
    );
    prismaMock.userAddress.create.mockResolvedValue({
      ...mockAddressResult,
      addressDetail: null,
    } as any);

    const { detail, ...inputWithoutDetail } = validInput;
    await createAddress(inputWithoutDetail);

    expect(prismaMock.userAddress.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        addressDetail: null,
      }),
    });
  });
});
