import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Store } from "lucide-react";
import {
  getDashboardOrders,
  getDashboardStats,
  getHourlyOrders,
  getPopularMenus,
  getRecentReviews,
} from "./_actions/dashboard-actions";
import { KanbanBoard } from "./_components/kanban-board";
import { KpiCards } from "./_components/kpi-cards";
import { HourlyChart } from "./_components/hourly-chart";
import { PopularMenus } from "./_components/popular-menus";
import { RecentReviews } from "./_components/recent-reviews";

export const metadata = { title: "사장님 대시보드 - B-Delivery" };

export default async function OwnerDashboardPage() {
  const session = await auth();

  // 사장님이 소유한 음식점 조회
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true, isOpen: true },
  });

  if (!restaurant) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            등록된 음식점이 없습니다. 음식점을 먼저 등록해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 모든 대시보드 데이터를 병렬로 로드
  const [orders, stats, hourlyData, popularMenus, recentReviews] =
    await Promise.all([
      getDashboardOrders(restaurant.id),
      getDashboardStats(restaurant.id),
      getHourlyOrders(restaurant.id),
      getPopularMenus(restaurant.id),
      getRecentReviews(restaurant.id),
    ]);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            안녕하세요, {session!.user.nickname}님 &middot;{" "}
            <span className="font-medium">{restaurant.name}</span>
            <span
              className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: restaurant.isOpen ? "#E8F5E9" : "#F5F5F5",
                color: restaurant.isOpen ? "#2E7D32" : "#757575",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: restaurant.isOpen ? "#2DB400" : "#9E9E9E",
                }}
              />
              {restaurant.isOpen ? "영업중" : "영업종료"}
            </span>
          </p>
        </div>
      </div>

      {/* 칸반 보드 (주문 현황) */}
      <KanbanBoard
        initialOrders={orders}
        restaurantId={restaurant.id}
      />

      {/* KPI 카드 */}
      <KpiCards stats={stats} />

      {/* 하단 2컬럼 레이아웃: 차트 + 인기메뉴 / 최근 리뷰 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <HourlyChart data={hourlyData} />
          <PopularMenus menus={popularMenus} />
        </div>
        <RecentReviews reviews={recentReviews} />
      </div>
    </div>
  );
}
