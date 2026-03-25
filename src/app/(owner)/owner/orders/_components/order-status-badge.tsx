import { OrderStatus } from "@/generated/prisma/enums";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "신규 주문",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  COOKING: {
    label: "조리중",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  PICKED_UP: {
    label: "배달중",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  DONE: {
    label: "완료",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "취소",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
