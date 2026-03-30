"use client";

import { useState, useCallback } from "react";
import { OwnerChatList } from "./owner-chat-list";
import { ChatRoom, ChatRoomEmpty } from "./chat-room";
import {
  getChatMessages,
  type OwnerChatItem,
  type OwnerChatMessage,
} from "../_actions/chat-actions";

interface OwnerChatPageProps {
  initialChats: OwnerChatItem[];
  currentUserId: string;
}

export function OwnerChatPage({
  initialChats,
  currentUserId,
}: OwnerChatPageProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<OwnerChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 선택된 채팅의 정보 가져오기
  const selectedChat = initialChats.find((c) => c.id === selectedChatId) ?? null;

  // 채팅 선택 시 메시지 로드
  const handleSelectChat = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId);
    setLoadingMessages(true);
    setChatMessages([]);

    try {
      const result = await getChatMessages(chatId);
      if (result.success) {
        setChatMessages(result.messages);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  return (
    <div className="flex h-[calc(100dvh)] -mt-0">
      {/* 왼쪽: 채팅 목록 (300px) */}
      <div className="w-[300px] shrink-0 border-r border-gray-200">
        <OwnerChatList
          initialChats={initialChats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* 오른쪽: 채팅방 (flex-1) */}
      <div className="flex-1 min-w-0">
        {selectedChat && !loadingMessages ? (
          <ChatRoom
            key={selectedChatId}
            chatId={selectedChat.id}
            currentUserId={currentUserId}
            category={selectedChat.category}
            status={selectedChat.status}
            initialMessages={chatMessages}
          />
        ) : loadingMessages ? (
          <div className="flex items-center justify-center h-full bg-white border-l border-gray-200">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="size-6 border-2 border-gray-300 border-t-[#2DB400] rounded-full animate-spin" />
              <p className="text-[13px]">메시지 로딩 중...</p>
            </div>
          </div>
        ) : (
          <ChatRoomEmpty />
        )}
      </div>
    </div>
  );
}
