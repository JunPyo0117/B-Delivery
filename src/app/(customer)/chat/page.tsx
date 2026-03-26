import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatHeader } from "./_components/ChatHeader";
import { BusinessHoursBanner } from "./_components/BusinessHoursBanner";
import { OrderCard } from "./_components/OrderCard";
import { ChatListBottomBar } from "./_components/ChatListBottomBar";
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
    <div className="flex flex-col min-h-dvh bg-white">
      <ChatHeader title="실시간 채팅 상담" />

      {/* 카테고리 칩 */}
      <div className="flex gap-2 px-4 mt-4">
        <span className="px-4 py-1.5 text-[13px] font-bold rounded-full bg-[#2DB400] text-white">
          배민
        </span>
        <span className="px-4 py-1.5 text-[13px] font-medium rounded-full border border-gray-300 text-gray-500">
          기타문의
        </span>
      </div>

      <BusinessHoursBanner />

      {/* 시스템 안내 메시지 */}
      <div className="px-4 mt-5">
        <p className="text-[14px] text-gray-600 mb-3">
          문의하고 싶은 주문을 선택해주세요.
        </p>

        {/* 주문 카드 목록 */}
        <div className="space-y-2.5">
          {orderItems.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>

        {orderItems.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-[14px] text-gray-400">
              주문 내역이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* 하단 링크 */}
      <div className="px-4 mt-6 mb-4 space-y-2.5 text-center">
        <button className="block w-full text-[14px] text-[#2DB400] font-medium hover:underline transition-colors">
          제가 찾는 주문이 없어요
        </button>
        <button className="block w-full text-[14px] text-[#2DB400] font-medium hover:underline transition-colors">
          주문 말고 다른 문의가 있어요
        </button>
      </div>

      {/* 하단 입력 바 (비활성) */}
      <ChatListBottomBar />
    </div>
  );
}
