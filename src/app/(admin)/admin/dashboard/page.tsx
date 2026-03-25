import { auth } from "@/auth";
import { getDashboardData } from "./_actions/get-dashboard-data";
import { KpiCards } from "./_components/kpi-cards";
import { RegionStats } from "./_components/region-stats";
import { RecentOrders } from "./_components/recent-orders";
import { RecentReports } from "./_components/recent-reports";

export const metadata = { title: "관리자 대시보드 - B-Delivery" };

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="p-6 lg:p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          안녕하세요, {session?.user.nickname}님 | {today}
        </p>
      </div>

      {/* KPI 카드 */}
      <section className="mb-8">
        <KpiCards data={data.kpi} />
      </section>

      {/* 지역 분포 + 최근 신고 (2열) */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <RegionStats data={data.regionStats} />
        <RecentReports data={data.recentReports} />
      </section>

      {/* 최근 주문 */}
      <section>
        <RecentOrders data={data.recentOrders} />
      </section>
    </div>
  );
}
