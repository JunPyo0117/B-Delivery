import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ClipboardList,
  UtensilsCrossed,
  MessageCircle,
  Clock,
  Store,
} from "lucide-react";

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

  const totalPendingOrders = restaurants.reduce(
    (sum, r) => sum + r._count.orders,
    0
  );

  // 읽지 않은 채팅 메시지 수 조회
  const restaurantIds = restaurants.map((r) => r.id);
  const unreadChatCount = restaurantIds.length > 0
    ? await prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: session!.user.id },
          chat: {
            order: { restaurantId: { in: restaurantIds } },
          },
        },
      })
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* 인사말 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          안녕하세요, {session!.user.nickname}님
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          오늘도 좋은 하루 되세요!
        </p>
      </div>

      {/* 빠른 액세스 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/owner/orders"
          className="relative flex flex-col items-center gap-2 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <ClipboardList className="h-6 w-6" style={{ color: "#2DB400" }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">주문 관리</span>
          {totalPendingOrders > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "#FF5252" }}
            >
              {totalPendingOrders}
            </span>
          )}
        </Link>

        <Link
          href="/owner/menus"
          className="flex flex-col items-center gap-2 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <UtensilsCrossed className="h-6 w-6" style={{ color: "#2DB400" }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">메뉴 관리</span>
        </Link>

        <Link
          href="/owner/settings"
          className="flex flex-col items-center gap-2 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <Store className="h-6 w-6" style={{ color: "#FF6B00" }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">가게 정보</span>
        </Link>

        <Link
          href="/owner/chat"
          className="relative flex flex-col items-center gap-2 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#E3F2FD" }}
          >
            <MessageCircle className="h-6 w-6" style={{ color: "#1976D2" }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">고객 채팅</span>
          {unreadChatCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "#FF5252" }}
            >
              {unreadChatCount}
            </span>
          )}
        </Link>
      </div>

      {/* 내 음식점 현황 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          내 음식점
        </h2>

        {restaurants.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <Store className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              등록된 음식점이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="rounded-xl border bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">
                      {restaurant.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      restaurant.isOpen
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        restaurant.isOpen ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {restaurant.isOpen ? "영업중" : "영업종료"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{restaurant.category}</span>
                  {restaurant._count.orders > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
                      <span className="font-medium" style={{ color: "#FF6B00" }}>
                        대기 주문 {restaurant._count.orders}건
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
