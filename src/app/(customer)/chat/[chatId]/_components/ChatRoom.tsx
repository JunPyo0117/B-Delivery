"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore } from "@/stores/chat";
import { ChatRoomHeader } from "./ChatRoomHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Loader2 } from "lucide-react";
import type { ChatMessageResponse } from "@/types/chat";

interface ChatRoomProps {
  chatId: string;
  currentUserId: string;
  restaurantName: string;
  orderId?: string;
  initialMessages: ChatMessageResponse[];
  hasMore: boolean;
}

export function ChatRoom({
  chatId,
  currentUserId,
  restaurantName,
  orderId,
  initialMessages,
  hasMore: initialHasMore,
}: ChatRoomProps) {
  const setMessages = useChatStore((s) => s.setMessages);
  const setHasMore = useChatStore((s) => s.setHasMore);
  const clearChat = useChatStore((s) => s.clearChat);

  // 초기 메시지 설정
  useEffect(() => {
    setMessages(chatId, initialMessages);
    setHasMore(chatId, initialHasMore);
    return () => clearChat(chatId);
  }, [chatId, initialMessages, initialHasMore, setMessages, setHasMore, clearChat]);

  const { isConnected, isConnecting, error, sendMessage, sendTyping } =
    useSocket(chatId);

  return (
    <div className="flex flex-col h-dvh bg-[#F8F8F8]">
      <ChatRoomHeader restaurantName={restaurantName} orderId={orderId} />

      {/* 연결 상태 배너 */}
      {(isConnecting || error) && (
        <div className="px-4 py-2 text-xs text-center bg-amber-50 text-amber-700 border-b border-amber-100">
          {isConnecting && (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              연결 중...
            </span>
          )}
          {error && <span>{error}</span>}
        </div>
      )}

      <MessageList chatId={chatId} currentUserId={currentUserId} initialMessages={initialMessages} />

      <ChatInput
        onSendText={(content) => sendMessage("TEXT", content)}
        onSendImage={(url) => sendMessage("IMAGE", url)}
        onTyping={sendTyping}
        disabled={!isConnected}
      />
    </div>
  );
}
