import type { KpiData } from "../_actions/get-dashboard-data";

interface KpiCardProps {
  title: string;
  value: number;
  description: string;
  highlight?: boolean;
}

function KpiCard({ title, value, description, highlight }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <span
        className={`text-3xl font-bold tabular-nums ${
          highlight ? "text-destructive" : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards: KpiCardProps[] = [
    {
      title: "DAU (일간 활성 사용자)",
      value: data.dau,
      description: "오늘 주문한 고유 사용자 수",
    },
    {
      title: "신규 가입",
      value: data.newUsers,
      description: "오늘 가입한 사용자 수",
    },
    {
      title: "신규 주문",
      value: data.newOrders,
      description: "오늘 접수된 주문 수",
    },
    {
      title: "완료 배달",
      value: data.completedDeliveries,
      description: "오늘 완료된 배달 수",
    },
    {
      title: "대기 신고",
      value: data.pendingReports,
      description: "처리 대기중인 신고 건수",
      highlight: data.pendingReports > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}
