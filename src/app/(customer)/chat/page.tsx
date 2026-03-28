import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatListPage } from "@/views/chat";
import type { ChatOrderItem } from "@/types/chat";

export default async function ChatRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      restaurant: { select: { name: true, imageUrl: true } },
      items: { include: { menu: { select: { name: true } } } },
      chats: { select: { id: true }, take: 1 },
    },
  });

  const orderItems: ChatOrderItem[] = orders.map((order: (typeof orders)[number]) => {
    const firstItem = order.items[0]?.menu.name ?? "알 수 없는 메뉴";
    const extraCount = order.items.length - 1;
    const itemSummary =
      extraCount > 0 ? `${firstItem} 외 ${extraCount}개` : firstItem;

    return {
      orderId: order.id,
      restaurantName: order.restaurant.name,
      restaurantImageUrl: order.restaurant.imageUrl,
      itemSummary,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt.toISOString(),
      chatId: order.chats[0]?.id ?? null,
    };
  });

  return <ChatListPage orderItems={orderItems} />;
}
