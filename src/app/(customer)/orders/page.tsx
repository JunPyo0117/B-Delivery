import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OrderTabs, {
  type OrderData,
} from "./_components/order-tabs";

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
      review: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const orderData: OrderData[] = orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt.toISOString(),
    restaurant: {
      name: order.restaurant.name,
      imageUrl: order.restaurant.imageUrl,
    },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      menu: { name: item.menu.name },
    })),
    hasReview: !!order.review,
  }));

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center h-12 px-4">
          <h1 className="text-base font-semibold">주문내역</h1>
        </div>
      </header>

      <OrderTabs orders={orderData} />
    </div>
  );
}
