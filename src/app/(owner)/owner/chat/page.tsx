import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "고객 채팅 - B-Delivery" };

export default async function OwnerChatListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 사장의 음식점 조회
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <MessageCircle className="size-12 mb-3" />
        <p className="text-sm">등록된 음식점이 없습니다.</p>
      </div>
    );
  }

  // 음식점 주문에 연결된 채팅 목록 조회
  const chats = await prisma.chat.findMany({
    where: {
      order: { restaurantId: restaurant.id },
    },
    include: {
      user: { select: { nickname: true, image: true } },
      order: { select: { id: true, totalPrice: true, createdAt: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, type: true, createdAt: true, senderId: true, isRead: true },
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderId: { not: session.user.id } },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <MessageCircle className="size-12 mb-3" />
        <p className="text-sm">아직 채팅이 없습니다.</p>
        <p className="text-xs mt-1">고객이 문의를 시작하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-[15px] font-bold text-gray-900">
          고객 채팅 ({chats.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-50">
        {chats.map((chat) => {
          const lastMsg = chat.messages[0];
          const unread = chat._count.messages;
          const preview =
            lastMsg?.type === "IMAGE"
              ? "사진"
              : lastMsg?.content
                ? lastMsg.content.length > 30
                  ? lastMsg.content.slice(0, 30) + "..."
                  : lastMsg.content
                : "새 대화";

          const timeStr = lastMsg
            ? new Date(lastMsg.createdAt).toLocaleString("ko-KR", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              {/* 아바타 */}
              <div className="size-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-gray-500">
                  {chat.user.nickname.charAt(0)}
                </span>
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-gray-900 truncate">
                    {chat.user.nickname}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {timeStr}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[13px] text-gray-500 truncate">{preview}</p>
                  {unread > 0 && (
                    <span
                      className="shrink-0 ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: "#FF5252" }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
