import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import type { OrderStatus } from "@/types/order";

import { OrderStatusClient } from "./_components/order-status-client";

export const metadata: Metadata = {
  title: "주문 상태",
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
          address: true,
          deliveryTime: true,
        },
      },
      items: {
        include: {
          menu: { select: { name: true } },
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const initialData = {
    orderId: order.id,
    status: order.status as OrderStatus,
    restaurantName: order.restaurant.name,
    restaurantLatitude: order.restaurant.latitude,
    restaurantLongitude: order.restaurant.longitude,
    restaurantAddress: order.restaurant.address,
    deliveryAddress: order.deliveryAddress,
    deliveryTime: order.restaurant.deliveryTime,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      menuName: item.menu.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  return <OrderStatusClient initialData={initialData} />;
}
