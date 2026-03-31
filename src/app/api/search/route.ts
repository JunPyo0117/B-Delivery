import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/auth";
import type { SearchResultItem } from "@/types/search";

const MAX_RESULTS = 20;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // 1. 메뉴 이름 또는 메뉴 카테고리로 매칭되는 결과
  const menuMatches = await prisma.menu.findMany({
    where: {
      isSoldOut: false,
      restaurant: { isOpen: true },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      name: true,
      price: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          reviews: {
            select: { rating: true },
          },
        },
      },
    },
    take: MAX_RESULTS,
  });

  // 2. 음식점 이름으로 매칭되는 결과
  const restaurantMatches = await prisma.restaurant.findMany({
    where: {
      isOpen: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      reviews: {
        select: { rating: true },
      },
    },
    take: MAX_RESULTS,
  });

  // 중복 제거를 위한 Set (restaurantId + menuName 조합)
  const seen = new Set<string>();
  const results: SearchResultItem[] = [];

  // 음식점 이름 매칭 결과 추가 (우선)
  for (const r of restaurantMatches) {
    const key = `${r.id}:__restaurant__`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ratings = r.reviews.map((rev) => rev.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    results.push({
      restaurantId: r.id,
      restaurantName: r.name,
      restaurantImageUrl: r.imageUrl,
      matchedMenuName: null,
      price: null,
      avgRating,
      reviewCount: ratings.length,
    });
  }

  // 메뉴 매칭 결과 추가
  for (const m of menuMatches) {
    const key = `${m.restaurant.id}:${m.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (results.length >= MAX_RESULTS) break;

    const ratings = m.restaurant.reviews.map((rev) => rev.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    results.push({
      restaurantId: m.restaurant.id,
      restaurantName: m.restaurant.name,
      restaurantImageUrl: m.restaurant.imageUrl,
      matchedMenuName: m.name,
      price: m.price,
      avgRating,
      reviewCount: ratings.length,
    });
  }

  return NextResponse.json({ results: results.slice(0, MAX_RESULTS) });
}
