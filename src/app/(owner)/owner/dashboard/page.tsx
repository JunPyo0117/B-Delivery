import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "사장님 대시보드 - B-Delivery" };

export default async function OwnerDashboardPage() {
  const session = await auth();

  // 사장님이 소유한 음식점 목록 조회
  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: session!.user.id },
    select: {
      id: true,
      name: true,
      category: true,
      isOpen: true,
      _count: {
        select: {
          orders: {
            where: {
              status: { in: ["PENDING", "COOKING"] },
            },
          },
        },
      },
    },
  });

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사장님 대시보드</h1>
        <p className="mt-1 text-muted-foreground">
          안녕하세요, {session!.user.nickname}님
        </p>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-muted-foreground">
            등록된 음식점이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="rounded-lg border bg-white p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{restaurant.name}</h2>
                <span
                  className={
                    restaurant.isOpen
                      ? "text-sm text-green-600 font-medium"
                      : "text-sm text-red-500 font-medium"
                  }
                >
                  {restaurant.isOpen ? "영업중" : "영업종료"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {restaurant.category}
              </p>
              {restaurant._count.orders > 0 && (
                <p className="text-sm font-medium text-orange-600">
                  처리 대기 주문 {restaurant._count.orders}건
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
