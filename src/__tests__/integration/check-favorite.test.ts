import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../helpers/prisma-mock";
import { createMockSession, mockAuth, mockedAuth } from "../helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { checkFavorite } from "@/features/favorite/api/checkFavorite";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkFavorite", () => {
  it("비인증 사용자: false를 반환한다", async () => {
    mockedAuth.mockImplementation(mockAuth(null));

    const result = await checkFavorite({ restaurantId: "rest-1" });

    expect(result).toBe(false);
    expect(prismaMock.favoriteRestaurant.findUnique).not.toHaveBeenCalled();
  });

  it("찜 레코드가 존재하면 true를 반환한다", async () => {
    mockedAuth.mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.favoriteRestaurant.findUnique.mockResolvedValue({
      userId: "user-1",
      restaurantId: "rest-1",
      createdAt: new Date(),
    } as any);

    const result = await checkFavorite({ restaurantId: "rest-1" });

    expect(result).toBe(true);
    expect(prismaMock.favoriteRestaurant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_restaurantId: {
          userId: "user-1",
          restaurantId: "rest-1",
        },
      },
    });
  });

  it("찜 레코드가 없으면 false를 반환한다", async () => {
    mockedAuth.mockImplementation(
      mockAuth(createMockSession({ id: "user-1" }))
    );
    prismaMock.favoriteRestaurant.findUnique.mockResolvedValue(null);

    const result = await checkFavorite({ restaurantId: "rest-1" });

    expect(result).toBe(false);
  });

  it("session.user.id가 없으면 false를 반환한다", async () => {
    mockedAuth.mockResolvedValue({
      user: {},
      expires: new Date().toISOString(),
    } as any);

    const result = await checkFavorite({ restaurantId: "rest-1" });

    expect(result).toBe(false);
  });
});
