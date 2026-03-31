import { describe, it, expect, vi } from "vitest";
import { toggleFavorite } from "@/features/favorite/api/toggleFavorite";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe("toggleFavorite", () => {
  it("찜 추가: 찜 레코드가 없으면 create를 호출하고 isFavorite true를 반환한다", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.favoriteRestaurant.findUnique.mockResolvedValue(null);
    prismaMock.favoriteRestaurant.create.mockResolvedValue({
      userId: "user-1",
      restaurantId: "rest-1",
      createdAt: new Date(),
    } as any);

    const result = await toggleFavorite({ restaurantId: "rest-1" });

    expect(result).toEqual({ isFavorite: true });
    expect(prismaMock.favoriteRestaurant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_restaurantId: { userId: "user-1", restaurantId: "rest-1" },
      },
    });
    expect(prismaMock.favoriteRestaurant.create).toHaveBeenCalledWith({
      data: { userId: "user-1", restaurantId: "rest-1" },
    });
  });

  it("찜 해제: 찜 레코드가 존재하면 delete를 호출하고 isFavorite false를 반환한다", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()));

    prismaMock.favoriteRestaurant.findUnique.mockResolvedValue({
      userId: "user-1",
      restaurantId: "rest-1",
      createdAt: new Date(),
    } as any);
    prismaMock.favoriteRestaurant.delete.mockResolvedValue({
      userId: "user-1",
      restaurantId: "rest-1",
      createdAt: new Date(),
    } as any);

    const result = await toggleFavorite({ restaurantId: "rest-1" });

    expect(result).toEqual({ isFavorite: false });
    expect(prismaMock.favoriteRestaurant.delete).toHaveBeenCalledWith({
      where: {
        userId_restaurantId: { userId: "user-1", restaurantId: "rest-1" },
      },
    });
  });

  it("비인증 사용자: 로그인 없이 호출하면 에러를 던진다", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockImplementation(mockAuth(null));

    await expect(toggleFavorite({ restaurantId: "rest-1" })).rejects.toThrow(
      "로그인이 필요합니다."
    );
    expect(prismaMock.favoriteRestaurant.findUnique).not.toHaveBeenCalled();
  });
});
