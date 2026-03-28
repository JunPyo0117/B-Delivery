import type { DashboardStats } from "../_actions/dashboard-actions";
import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingBag, Calculator, Timer } from "lucide-react";

interface KpiCardsProps {
  stats: DashboardStats;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return (price / 10000).toLocaleString("ko-KR") + "만원";
  }
  return price.toLocaleString("ko-KR") + "원";
}

function ChangeIndicator({
  value,
  invertColor = false,
}: {
  value: number;
  invertColor?: boolean;
}) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-gray-400">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  // 배달시간은 낮아지는 게 좋으므로 invertColor
  const isPositive = value > 0;
  const isGood = invertColor ? !isPositive : isPositive;

  return (
    <span
      className="flex items-center gap-0.5 text-xs font-bold"
      style={{ color: isGood ? "#2DB400" : "#FF5252" }}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}

const KPI_ITEMS: {
  key: keyof Pick<
    DashboardStats,
    "todaySales" | "todayOrderCount" | "avgOrderPrice" | "avgDeliveryTime"
  >;
  changeKey: keyof Pick<
    DashboardStats,
    | "salesChange"
    | "orderCountChange"
    | "avgPriceChange"
    | "deliveryTimeChange"
  >;
  label: string;
  icon: typeof DollarSign;
  iconBg: string;
  iconColor: string;
  format: (v: number) => string;
  invertColor?: boolean;
}[] = [
  {
    key: "todaySales",
    changeKey: "salesChange",
    label: "오늘 매출",
    icon: DollarSign,
    iconBg: "#E8F5E9",
    iconColor: "#2DB400",
    format: formatPrice,
  },
  {
    key: "todayOrderCount",
    changeKey: "orderCountChange",
    label: "주문 건수",
    icon: ShoppingBag,
    iconBg: "#E3F2FD",
    iconColor: "#1565C0",
    format: (v) => `${v}건`,
  },
  {
    key: "avgOrderPrice",
    changeKey: "avgPriceChange",
    label: "평균 주문금액",
    icon: Calculator,
    iconBg: "#FFF3E0",
    iconColor: "#E65100",
    format: formatPrice,
  },
  {
    key: "avgDeliveryTime",
    changeKey: "deliveryTimeChange",
    label: "평균 배달시간",
    icon: Timer,
    iconBg: "#F3E5F5",
    iconColor: "#6A1B9A",
    format: (v) => (v > 0 ? `${v}분` : "-"),
    invertColor: true,
  },
];

export function KpiCards({ stats }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: item.iconColor }} />
              </div>
              <ChangeIndicator
                value={stats[item.changeKey]}
                invertColor={item.invertColor}
              />
            </div>
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">
              {item.format(stats[item.key])}
            </p>
          </div>
        );
      })}
    </div>
  );
}
