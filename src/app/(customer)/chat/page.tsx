import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatHeader } from "./_components/ChatHeader";
import { BusinessHoursBanner } from "./_components/BusinessHoursBanner";
import { OrderCard } from "./_components/OrderCard";
import type { ChatOrderItem } from "@/types/chat";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      restaurant: { select: { name: true, imageUrl: true } },
      items: { include: { menu: { select: { name: true } } } },
      chat: { select: { id: true } },
    },
  });

  const orderItems: ChatOrderItem[] = orders.map((order: typeof orders[number]) => {
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
      chatId: order.chat?.id ?? null,
    };
  });

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <ChatHeader title="실시간 채팅 상담" />

      {/* 탭 */}
      <div className="flex gap-2 px-4 mt-3">
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#2AC1BC] text-white">
          배민
        </span>
        <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
          기타문의
        </span>
      </div>

      <BusinessHoursBanner />

      {/* 주문 선택 안내 */}
      <div className="px-4 mt-4">
        <p className="text-sm text-gray-600 mb-3">
          문의하고 싶은 주문을 선택해주세요.
        </p>

        <div className="space-y-2">
          {orderItems.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>

        {orderItems.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            주문 내역이 없습니다.
          </p>
        )}
      </div>

      {/* 하단 링크 */}
      <div className="px-4 mt-4 space-y-2 text-center">
        <p className="text-sm text-[#2AC1BC] font-medium">
          제가 찾는 주문이 없어요
        </p>
        <p className="text-sm text-[#2AC1BC] font-medium">
          주문 말고 다른 문의가 있어요
        </p>
      </div>

      {/* 비활성 입력 영역 */}
      <div className="mt-auto sticky bottom-14 border-t bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-400 text-center">
          현재는 텍스트 입력이 불가합니다.
        </p>
      </div>
    </div>
  );
}
