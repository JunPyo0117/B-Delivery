import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  PICKED_UP: "배달 중",
  DONE: "배달 완료",
  CANCELLED: "취소됨",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  PICKED_UP: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      restaurant: { select: { name: true, imageUrl: true } },
      items: {
        include: { menu: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center h-12 px-4">
          <h1 className="text-base font-semibold">주문내역</h1>
        </div>
      </header>

      <div className="flex-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg font-medium">주문 내역이 없어요</p>
            <Link
              href="/"
              className="mt-3 text-sm text-primary font-semibold hover:underline"
            >
              맛있는 음식 주문하러 가기
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => {
              const itemSummary =
                order.items.length === 1
                  ? order.items[0].menu.name
                  : `${order.items[0].menu.name} 외 ${order.items.length - 1}개`;

              const dateStr = new Date(order.createdAt).toLocaleDateString(
                "ko-KR",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                }
              );

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block px-4 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{dateStr}</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {order.restaurant.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        statusColor[order.status] ?? ""
                      }`}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{itemSummary}</p>
                  <p className="text-sm font-semibold mt-1">
                    {order.totalPrice.toLocaleString()}원
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    주문상세 &gt;
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
