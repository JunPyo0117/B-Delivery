import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderListPage } from "@/views/orders";
import type { OrderData } from "@/views/orders";

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
        include: { menu: { select: { name: true, imageUrl: true } } },
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
      menu: { name: item.menu.name, imageUrl: item.menu.imageUrl },
    })),
    hasReview: !!order.review,
  }));

  return <OrderListPage orders={orderData} />;
}
