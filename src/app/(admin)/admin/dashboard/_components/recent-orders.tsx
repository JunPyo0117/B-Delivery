import type { RecentOrder } from "../_actions/get-dashboard-data";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "접수", className: "bg-yellow-100 text-yellow-800" },
  COOKING: { label: "조리중", className: "bg-blue-100 text-blue-800" },
  PICKED_UP: { label: "배달중", className: "bg-purple-100 text-purple-800" },
  DONE: { label: "완료", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "취소", className: "bg-red-100 text-red-800" },
};

interface RecentOrdersProps {
  data: RecentOrder[];
}

export function RecentOrders({ data }: RecentOrdersProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h3 className="mb-4 text-base font-semibold">최근 주문</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          주문 내역이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h3 className="mb-4 text-base font-semibold">최근 주문</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">주문번호</th>
              <th className="pb-2 font-medium">고객</th>
              <th className="pb-2 font-medium">음식점</th>
              <th className="pb-2 text-right font-medium">금액</th>
              <th className="pb-2 font-medium">상태</th>
              <th className="pb-2 font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {data.map((order) => {
              const status = statusLabels[order.status] || {
                label: order.status,
                className: "bg-gray-100 text-gray-800",
              };
              return (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-2.5">{order.userName}</td>
                  <td className="py-2.5">{order.restaurantName}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {order.totalPrice.toLocaleString()}원
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}
