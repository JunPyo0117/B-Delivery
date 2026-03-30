"use client";

import { useState, useEffect, useCallback } from "react";
import { getChatList, type AdminChatListItem } from "../actions";
import type { ChatStatus, ChatType } from "@/generated/prisma/client";

// ─── Constants ───────────────────────────────────────────

const STATUS_TABS: { value: ChatStatus | "ALL"; label: string }[] = [
  { value: "WAITING", label: "대기" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "CLOSED", label: "완료" },
];

const TYPE_FILTERS: { value: ChatType | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "CUSTOMER_SUPPORT", label: "고객" },
  { value: "OWNER_SUPPORT", label: "사장" },
  { value: "RIDER_SUPPORT", label: "기사" },
];

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  USER: {
    label: "고객",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  OWNER: {
    label: "사장",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  RIDER: {
    label: "기사",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  ADMIN: {
    label: "관리자",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

// ─── Helpers ─────────────────────────────────────────────

function formatElapsedTime(iso: string): { text: string; isOverdue: boolean } {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return { text: "방금 전", isOverdue: false };
  if (minutes < 60)
    return { text: `${minutes}분 전`, isOverdue: minutes >= 5 };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `${hours}시간 전`, isOverdue: true };
  const days = Math.floor(hours / 24);
  return { text: `${days}일 전`, isOverdue: true };
}

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${hour12}:${m}`;
  } else if (diffDays === 1) {
    return "어제";
  } else {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

// ─── Props ───────────────────────────────────────────────

interface ChatListPanelProps {
  initialChats: AdminChatListItem[];
  initialWaitingCount: number;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  /** 외부에서 목록 갱신을 트리거할 카운터 (값이 바뀌면 목록 재조회) */
  refreshTrigger?: number;
}

// ─── Component ───────────────────────────────────────────

export function ChatListPanel({
  initialChats,
  initialWaitingCount,
  selectedChatId,
  onSelectChat,
  refreshTrigger = 0,
}: ChatListPanelProps) {
  const [activeTab, setActiveTab] = useState<ChatStatus | "ALL">("WAITING");
  const [typeFilter, setTypeFilter] = useState<ChatType | "ALL">("ALL");
  const [chats, setChats] = useState<AdminChatListItem[]>(initialChats);
  const [waitingCount, setWaitingCount] = useState(initialWaitingCount);

  // 탭 또는 필터 변경 시 목록 갱신
  const fetchChats = useCallback(
    async (status: ChatStatus | "ALL", chatType: ChatType | "ALL") => {
      try {
        const items = await getChatList({
          status: status === "ALL" ? "ALL" : status,
          chatType: chatType === "ALL" ? "ALL" : chatType,
        });
        setChats(items);
      } catch (error) {
        console.error("[ChatListPanel] fetchChats error:", error);
      }
    },
    []
  );

  // 탭 변경
  const handleTabChange = useCallback(
    (tab: ChatStatus | "ALL") => {
      setActiveTab(tab);
      fetchChats(tab, typeFilter);
    },
    [typeFilter, fetchChats]
  );

  // 유형 필터 변경
  const handleTypeFilterChange = useCallback(
    (type: ChatType | "ALL") => {
      setTypeFilter(type);
      fetchChats(activeTab, type);
    },
    [activeTab, fetchChats]
  );

  // 외부 refreshTrigger 변경 시 목록 재조회
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchChats(activeTab, typeFilter);
      // 대기 건수도 갱신
      getChatList({ status: "WAITING" }).then((items) =>
        setWaitingCount(items.length)
      ).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // 폴링: 10초마다 목록 갱신
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const items = await getChatList({
          status: activeTab === "ALL" ? "ALL" : activeTab,
          chatType: typeFilter === "ALL" ? "ALL" : typeFilter,
        });
        setChats(items);

        // 대기 건수도 갱신
        const waitingItems = await getChatList({ status: "WAITING" });
        setWaitingCount(waitingItems.length);
      } catch {
        // 무시
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, typeFilter]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-gray-900">상담 채팅</h2>
          {waitingCount > 0 && (
            <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {waitingCount}
            </span>
          )}
        </div>
      </div>

      {/* 상태 탭 */}
      <div className="shrink-0 border-b border-gray-100 px-3 pt-2">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const isWaiting = tab.value === "WAITING";
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`relative rounded-t-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-white text-gray-900 border border-b-0 border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className={isWaiting && isActive ? "text-red-500" : ""}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 유형 필터 (pill 버튼) */}
      <div className="shrink-0 border-b border-gray-100 px-3 py-2">
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((filter) => {
            const isActive = typeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => handleTypeFilterChange(filter.value)}
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="mb-2 text-3xl">💬</span>
            <p className="text-[13px]">상담 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {chats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              const roleBadge = ROLE_BADGE[chat.user.role] ?? ROLE_BADGE.USER;
              const preview = chat.lastMessage
                ? chat.lastMessage.content.length > 25
                  ? chat.lastMessage.content.slice(0, 25) + "..."
                  : chat.lastMessage.content
                : "새 대화";

              const timeSource =
                chat.lastMessage?.createdAt ?? chat.createdAt;

              // 대기 탭일 때만 경과 시간 표시
              const elapsed =
                activeTab === "WAITING"
                  ? formatElapsedTime(chat.createdAt)
                  : null;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    isSelected
                      ? "bg-green-50 border-l-2 border-l-[#2DB400]"
                      : "border-l-2 border-l-transparent hover:bg-gray-50"
                  }`}
                >
                  {/* 아바타 */}
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? "bg-[#2DB400]/10" : "bg-gray-100"
                    }`}
                  >
                    {chat.user.image ? (
                      <img
                        src={chat.user.image}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">
                        {chat.user.nickname?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate text-[14px] font-semibold text-gray-900">
                          {chat.user.nickname}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                      </div>
                      {elapsed ? (
                        <span
                          className={`shrink-0 ml-2 text-[11px] font-medium ${
                            elapsed.isOverdue
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                          suppressHydrationWarning
                        >
                          {elapsed.text}
                        </span>
                      ) : (
                        <span
                          className="shrink-0 ml-2 text-[11px] text-gray-400"
                          suppressHydrationWarning
                        >
                          {formatChatTime(timeSource)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="truncate text-[13px] text-gray-500">
                        {preview}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 shrink-0 size-2.5 rounded-full bg-[#2DB400]" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
