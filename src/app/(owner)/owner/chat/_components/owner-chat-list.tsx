"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChatList, type ChatListItem } from "@/hooks/useChatList";

export function OwnerChatList({
  initialChats,
}: {
  initialChats: ChatListItem[];
}) {
  const router = useRouter();
  const chats = useChatList(initialChats, () => router.refresh());

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-[15px] font-bold text-gray-900">
          고객 채팅 ({chats.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-50">
        {chats.map((chat) => {
          const lastMsg = chat.lastMessage;
          const unread = chat.unreadCount;
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
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2" suppressHydrationWarning>
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
