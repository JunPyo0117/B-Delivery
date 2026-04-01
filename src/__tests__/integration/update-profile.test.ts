import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("updateProfile", () => {
  async function importUpdateProfile() {
    const { updateProfile } = await import(
      "@/entities/user/api/updateProfile"
    );
    return updateProfile;
  }

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    nickname: "새닉네임",
    image: null,
    role: "USER",
    defaultAddress: null,
    latitude: null,
    longitude: null,
  };

  it("닉네임 수정 성공: 닉네임을 변경하고 프로필을 반환한다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.update.mockResolvedValue(mockUser as any);

    const result = await updateProfile({ nickname: "새닉네임" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { nickname: "새닉네임" },
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

  it("이미지 수정 성공: 프로필 이미지를 변경한다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      image: "new-image.jpg",
    } as any);

    const result = await updateProfile({ image: "new-image.jpg" });

    expect(result.success).toBe(true);
    expect(result.data?.image).toBe("new-image.jpg");
  });

  it("이미지 삭제: image를 null로 설정할 수 있다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.update.mockResolvedValue(mockUser as any);

    await updateProfile({ image: null });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { image: null },
      })
    );
  });

  it("비인증 사용자: 로그인 없이 호출하면 실패한다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(null));

    const result = await updateProfile({ nickname: "테스트" });

    expect(result).toEqual({ success: false, error: "로그인이 필요합니다." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("DB 에러: 업데이트 실패 시 에러 메시지를 반환한다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.update.mockRejectedValue(new Error("DB error"));

    const result = await updateProfile({ nickname: "테스트" });

    expect(result).toEqual({
      success: false,
      error: "프로필 수정에 실패했습니다.",
    });
  });

  it("부분 업데이트: nickname만 전달하면 image는 포함하지 않는다", async () => {
    const updateProfile = await importUpdateProfile();
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.user.update.mockResolvedValue(mockUser as any);

    await updateProfile({ nickname: "새닉네임" });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { nickname: "새닉네임" },
      })
    );
  });
});
