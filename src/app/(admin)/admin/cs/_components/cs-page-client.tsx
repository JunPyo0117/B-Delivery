"use client";

import { useState, useCallback } from "react";
import { ChatListPanel } from "./chat-list-panel";
import { ChatRoomPanel } from "./chat-room-panel";
import { InfoPanel } from "./info-panel";
import {
  getChatMessages,
  getChatDetail,
  type AdminChatListItem,
  type AdminChatMessage,
  type AdminChatDetail,
} from "../actions";

interface CsPageClientProps {
  initialChats: AdminChatListItem[];
  waitingCount: number;
  adminNickname: string;
  adminId: string;
}

export function CsPageClient({
  initialChats,
  waitingCount,
  adminNickname,
  adminId,
}: CsPageClientProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([]);
  const [chatDetail, setChatDetail] = useState<AdminChatDetail | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [listRefreshTrigger, setListRefreshTrigger] = useState(0);

  // 새 메시지 수신 시 채팅 목록 갱신
  const handleNewMessage = useCallback(() => {
    setListRefreshTrigger((prev) => prev + 1);
  }, []);

  // 채팅 선택 시 메시지 + 상세 정보 로드
  const handleSelectChat = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId);
    setLoadingMessages(true);
    setChatMessages([]);
    setChatDetail(null);

    try {
      const [messagesResult, detail] = await Promise.all([
        getChatMessages(chatId),
        getChatDetail(chatId),
      ]);

      if (messagesResult.success) {
        setChatMessages(messagesResult.messages);
      }
      if (detail) {
        setChatDetail(detail);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* 상단 헤더 */}
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b px-6"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <h1 className="text-lg font-bold text-white">
          B-Delivery 고객센터
        </h1>
        <span className="text-sm text-white/70">
          상담원: {adminNickname}
        </span>
      </header>

      {/* 3패널 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 채팅 목록 (300px) */}
        <div className="w-[300px] shrink-0 border-r border-gray-200">
          <ChatListPanel
            initialChats={initialChats}
            initialWaitingCount={waitingCount}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            refreshTrigger={listRefreshTrigger}
          />
        </div>

        {/* 중앙: 채팅방 (flex-1) */}
        <div className="flex-1 min-w-0">
          {selectedChatId && !loadingMessages ? (
            <ChatRoomPanel
              key={selectedChatId}
              chatId={selectedChatId}
              adminId={adminId}
              chatDetail={chatDetail}
              initialMessages={chatMessages}
              onStatusChange={() => handleSelectChat(selectedChatId)}
              onNewMessage={handleNewMessage}
            />
          ) : loadingMessages ? (
            <div className="flex h-full items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <div className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#2DB400]" />
                <p className="text-[13px]">메시지 로딩 중...</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-[15px] font-medium text-gray-500">
                채팅을 선택해주세요
              </p>
              <p className="mt-1 text-[13px] text-gray-400">
                왼쪽 목록에서 상담을 선택하세요
              </p>
            </div>
          )}
        </div>

        {/* 우측: 상담 정보 (320px) */}
        <div className="w-[320px] shrink-0 border-l border-gray-200">
          <InfoPanel
            chatDetail={chatDetail}
            onChatCreated={(chatId) => {
              handleNewMessage();
              handleSelectChat(chatId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
