import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { BarChart3 } from "lucide-react";
import { StatsDashboard } from "./_components/stats-dashboard";

export const metadata = { title: "매출 통계 - B-Delivery 사장님" };

export default async function OwnerStatsPage() {
  const session = await auth();

  // 사장님이 소유한 음식점 조회
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    return (
      <div>
        <div className="px-4 py-5" style={{ backgroundColor: "#2DB400" }}>
          <h1 className="text-lg font-bold text-white">매출 통계</h1>
        </div>
        <div className="p-4">
          <div className="rounded-xl border bg-white p-8 text-center">
            <BarChart3 className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 text-gray-500">
              등록된 음식점이 없습니다. 음식점을 먼저 등록해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StatsDashboard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
    />
  );
}
