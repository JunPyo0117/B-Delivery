"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MessageCircle, Headphones } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  getOwnerChats,
  createOwnerChat,
  type OwnerChatItem,
} from "../_actions/chat-actions";

// ─── Constants ───────────────────────────────────────────

const CATEGORIES = [
  { value: "주문문의", label: "주문문의" },
  { value: "메뉴문의", label: "메뉴문의" },
  { value: "정산문의", label: "정산문의" },
  { value: "기타", label: "기타" },
] as const;

// ─── Helpers ─────────────────────────────────────────────

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // 오늘: 시간 표시
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

interface OwnerChatListProps {
  initialChats: OwnerChatItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

// ─── Component ───────────────────────────────────────────

export function OwnerChatList({
  initialChats,
  selectedChatId,
  onSelectChat,
}: OwnerChatListProps) {
  const [chats, setChats] = useState<OwnerChatItem[]>(initialChats);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("주문문의");
  const [isCreating, setIsCreating] = useState(false);

  // 폴링: 10초마다 목록 갱신
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getOwnerChats();
      if (result.success) {
        setChats(result.chats);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 새 상담 생성
  const handleCreateChat = useCallback(async () => {
    setIsCreating(true);
    try {
      const result = await createOwnerChat(selectedCategory);
      if (result.success && result.chatId) {
        // 목록 새로고침
        const listResult = await getOwnerChats();
        if (listResult.success) {
          setChats(listResult.chats);
        }
        setDialogOpen(false);
        onSelectChat(result.chatId);
      }
    } finally {
      setIsCreating(false);
    }
  }, [selectedCategory, onSelectChat]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900">
          고객센터 상담 ({chats.length})
        </h2>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageCircle className="size-10 mb-2" />
            <p className="text-[13px]">상담 내역이 없습니다.</p>
            <p className="text-[12px] mt-0.5">
              아래 버튼으로 새 상담을 시작하세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {chats.map((chat) => {
              const isSelected = chat.id === selectedChatId;
              const lastMsg = chat.lastMessage;
              const preview = lastMsg
                ? lastMsg.type === "IMAGE"
                  ? "사진"
                  : lastMsg.content.length > 30
                    ? lastMsg.content.slice(0, 30) + "..."
                    : lastMsg.content
                : "새 대화";

              const timeStr = lastMsg
                ? formatChatTime(lastMsg.createdAt)
                : formatChatTime(chat.createdAt);

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    isSelected
                      ? "bg-[#2DB400]/5 border-l-2 border-l-[#2DB400]"
                      : "hover:bg-gray-50 border-l-2 border-l-transparent"
                  }`}
                >
                  {/* 아이콘 */}
                  <div
                    className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#2DB400]/10" : "bg-gray-100"
                    }`}
                  >
                    <Headphones
                      className={`size-4.5 ${isSelected ? "text-[#2DB400]" : "text-gray-400"}`}
                    />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-gray-900 truncate">
                        {chat.category || "고객센터 문의"}
                      </span>
                      <span
                        className="text-[11px] text-gray-400 shrink-0 ml-2"
                        suppressHydrationWarning
                      >
                        {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[13px] text-gray-500 truncate">
                        {preview}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="shrink-0 ml-2 size-2.5 rounded-full bg-[#2DB400]" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 새 상담 시작 버튼 */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full h-10 bg-[#2DB400] hover:bg-[#269900] text-white text-[14px] font-medium rounded-lg"
        >
          <Plus className="size-4 mr-1.5" />
          새 상담 시작
        </Button>
      </div>

      {/* 새 상담 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>새 상담 시작</DialogTitle>
            <DialogDescription>
              문의 카테고리를 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-[13px] font-medium text-gray-700 mb-2 block">
              문의 유형
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-2.5 rounded-lg text-[13px] font-medium border transition-all ${
                    selectedCategory === cat.value
                      ? "border-[#2DB400] bg-[#2DB400]/5 text-[#2DB400]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="text-[13px]"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateChat}
              disabled={isCreating}
              className="bg-[#2DB400] hover:bg-[#269900] text-white text-[13px]"
            >
              {isCreating ? "생성 중..." : "상담 시작"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
