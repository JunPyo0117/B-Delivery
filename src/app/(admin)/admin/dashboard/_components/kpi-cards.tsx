import type { KpiData } from "../_actions/get-dashboard-data";

interface KpiCardConfig {
  title: string;
  value: number;
  unit: string;
  variant: "default" | "brand" | "danger";
  statusText?: string;
}

function KpiCard({ title, value, unit, variant, statusText }: KpiCardConfig) {
  const valueColor =
    variant === "danger"
      ? "text-red-600"
      : variant === "brand"
        ? "text-brand"
        : "text-foreground";

  const statusColor =
    variant === "danger"
      ? "text-red-500 font-semibold"
      : "text-brand font-semibold";

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl p-[18px] ${
        variant === "danger" ? "bg-red-50" : "bg-card"
      }`}
    >
      <span className="text-xs text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-[22px] font-bold tabular-nums ${valueColor}`}>
          {value.toLocaleString()}
        </span>
        <span className={`text-sm ${valueColor}`}>{unit}</span>
      </div>
      {statusText && (
        <span className={`text-xs ${statusColor}`}>{statusText}</span>
      )}
    </div>
  );
}

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards: KpiCardConfig[] = [
    {
      title: "DAU (일간 활성)",
      value: data.dau,
      unit: "명",
      variant: "default",
    },
    {
      title: "신규 가입",
      value: data.newUsers,
      unit: "명",
      variant: "default",
    },
    {
      title: "신규 주문",
      value: data.newOrders,
      unit: "건",
      variant: "default",
    },
    {
      title: "활성 기사",
      value: data.activeRiders,
      unit: "명",
      variant: "brand",
      statusText: "온라인",
    },
    {
      title: "신고 대기",
      value: data.pendingReports,
      unit: "건",
      variant: "danger",
      statusText: "처리 필요",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}
