import type { RegionStat } from "../_actions/get-dashboard-data";

interface RegionStatsProps {
  data: RegionStat[];
}

export function RegionStats({ data }: RegionStatsProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h3 className="mb-4 text-base font-semibold">주문 지역 분포 (최근 7일)</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          데이터가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h3 className="mb-4 text-base font-semibold">주문 지역 분포 (최근 7일)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">순위</th>
              <th className="pb-2 font-medium">지역</th>
              <th className="pb-2 text-right font-medium">주문 수</th>
              <th className="pb-2 text-right font-medium">총 매출</th>
            </tr>
          </thead>
          <tbody>
            {data.map((stat, index) => (
              <tr key={stat.address} className="border-b last:border-0">
                <td className="py-2.5 tabular-nums text-muted-foreground">
                  {index + 1}
                </td>
                <td className="py-2.5 font-medium">{stat.address}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {stat.orderCount.toLocaleString()}건
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {stat.totalRevenue.toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
