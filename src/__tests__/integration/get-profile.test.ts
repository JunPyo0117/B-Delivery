import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth, mockedAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("getProfile", () => {
  async function importGetProfile() {
    const { getProfile } = await import("@/entities/user/api/getProfile");
    return getProfile;
  }

  it("프로필 조회 성공: 사용자 프로필을 반환한다", async () => {
    const getProfile = await importGetProfile();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      nickname: "테스트유저",
      image: null,
      role: "USER",
      defaultAddress: "서울시 강남구",
      latitude: 37.5065,
      longitude: 127.0536,
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

    const result = await getProfile();

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        email: true,
        nickname: true,
        image: true,
        role: true,
        defaultAddress: true,
        latitude: true,
        longitude: true,
      },
    });
  });

  it("비인증 사용자: 로그인 없이 호출하면 null을 반환한다", async () => {
    const getProfile = await importGetProfile();
    mockedAuth.mockImplementation(mockAuth(null));

    const result = await getProfile();

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("사용자 없음: DB에 사용자가 없으면 null을 반환한다", async () => {
    const getProfile = await importGetProfile();
    mockedAuth.mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await getProfile();

    expect(result).toBeNull();
  });
});
