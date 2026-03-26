import { OrderStatus } from "@/generated/prisma/enums";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  PENDING: {
    label: "신규",
    bgColor: "#FFF3E0",
    textColor: "#E65100",
  },
  COOKING: {
    label: "조리중",
    bgColor: "#E3F2FD",
    textColor: "#1565C0",
  },
  PICKED_UP: {
    label: "배달중",
    bgColor: "#E8F5E9",
    textColor: "#2E7D32",
  },
  DONE: {
    label: "완료",
    bgColor: "#F5F5F5",
    textColor: "#757575",
  },
  CANCELLED: {
    label: "취소",
    bgColor: "#FFEBEE",
    textColor: "#C62828",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      {config.label}
    </span>
  );
}
