"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { Send, Loader2, Camera, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  getChatMessages,
  sendMessage,
  updateChatStatus,
  assignChat,
  markAsRead,
  type AdminChatMessage,
  type AdminChatDetail,
} from "../actions";

// ─── Helpers ─────────────────────────────────────────────

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

function shouldShowTime(msgs: AdminChatMessage[], idx: number) {
  const current = msgs[idx];
  const next = msgs[idx + 1];
  if (!next) return true;
  if (next.senderId !== current.senderId) return true;
  const diff =
    new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime();
  return diff > 60_000;
}

function shouldShowSender(msgs: AdminChatMessage[], idx: number) {
  if (idx === 0) return true;
  const prev = msgs[idx - 1];
  if (prev.senderId !== msgs[idx].senderId) return true;
  if (!isSameDay(prev.createdAt, msgs[idx].createdAt)) return true;
  return false;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  USER: { label: "고객", className: "bg-green-100 text-green-700" },
  OWNER: { label: "사장", className: "bg-orange-100 text-orange-700" },
  RIDER: { label: "기사", className: "bg-gray-100 text-gray-600" },
  ADMIN: { label: "관리자", className: "bg-blue-100 text-blue-700" },
};

// ─── Props ───────────────────────────────────────────────

interface ChatRoomPanelProps {
  chatId: string;
  adminId: string;
  chatDetail: AdminChatDetail | null;
  initialMessages: AdminChatMessage[];
  onStatusChange: () => void;
}

// ─── Component ───────────────────────────────────────────

export function ChatRoomPanel({
  chatId,
  adminId,
  chatDetail,
  initialMessages,
  onStatusChange,
}: ChatRoomPanelProps) {
  const [messages, setMessages] = useState<AdminChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottom = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isClosed = chatDetail?.status === "CLOSED";
  const hasText = inputText.trim().length > 0;

  const roleBadge = chatDetail
    ? ROLE_BADGE[chatDetail.user.role] ?? ROLE_BADGE.USER
    : null;

  // 하단으로 스크롤
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // 초기 마운트 시 하단 스크롤 + 읽음 처리 + 상담원 배정
  useEffect(() => {
    scrollToBottom();
    markAsRead(chatId);

    // 아직 배정되지 않은 채팅이면 자동 배정
    if (chatDetail && !chatDetail.adminId) {
      assignChat(chatId);
    }
  }, [chatId, scrollToBottom, chatDetail]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    if (isAtBottom.current) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // 스크롤 위치 추적
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  // 폴링: 5초마다 새 메시지 확인
  useEffect(() => {
    async function pollMessages() {
      const result = await getChatMessages(chatId);
      if (result.success && result.messages.length > 0) {
        let hasNew = false;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = result.messages.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            hasNew = true;
            return [...prev, ...newMsgs];
          }
          // 읽음 상태 업데이트
          const hasReadChanges = result.messages.some((newMsg) => {
            const existing = prev.find((p) => p.id === newMsg.id);
            return existing && existing.isRead !== newMsg.isRead;
          });
          if (hasReadChanges) {
            return prev.map((msg) => {
              const updated = result.messages.find((m) => m.id === msg.id);
              return updated ? { ...msg, isRead: updated.isRead } : msg;
            });
          }
          return prev;
        });
        if (hasNew) {
          markAsRead(chatId);
        }
      }
    }

    pollRef.current = setInterval(pollMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [chatId]);

  // 메시지 전송
  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText("");

    // Optimistic UI
    const tempMsg: AdminChatMessage = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: adminId,
      nickname: "",
      type: "TEXT",
      content: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    isAtBottom.current = true;

    try {
      const result = await sendMessage(chatId, trimmed);
      if (result.success && result.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? result.message! : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, isSending, chatId, adminId]);

  // 이미지 전송
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const presignedRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "chat",
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignedRes.ok) throw new Error("업로드 URL 생성 실패");

        const { uploadUrl, publicUrl } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error("이미지 업로드 실패");

        await sendMessage(chatId, publicUrl, "IMAGE");

        // 재로드
        const result = await getChatMessages(chatId);
        if (result.success) {
          setMessages(result.messages);
        }
      } catch (err) {
        console.error("[ChatRoomPanel] 이미지 업로드 실패:", err);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [chatId]
  );

  // Enter 키 전송
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // 상담 완료
  const handleClose = useCallback(async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      const result = await updateChatStatus(chatId, "CLOSED");
      if (result.success) {
        onStatusChange();
      }
    } finally {
      setIsClosing(false);
    }
  }, [chatId, isClosing, onStatusChange]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <div className="flex items-center gap-2.5">
          {chatDetail && (
            <>
              <span className="text-[15px] font-bold text-gray-900">
                {chatDetail.user.nickname}
              </span>
              {roleBadge && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${roleBadge.className}`}
                >
                  {roleBadge.label}
                </span>
              )}
              {chatDetail.order && (
                <span className="text-[12px] text-gray-400">
                  주문 #{chatDetail.order.id.slice(0, 8)}
                </span>
              )}
            </>
          )}
        </div>
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isClosing}
            className="text-[12px]"
          >
            <CheckCircle className="mr-1 size-3.5" />
            {isClosing ? "처리 중..." : "상담 완료"}
          </Button>
        )}
        {isClosed && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 border border-gray-200">
            종료됨
          </span>
        )}
      </header>

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#F8F8F8]"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <MessageCircle className="mb-2 size-10" />
            <p className="text-[13px]">메시지가 없습니다.</p>
            <p className="mt-0.5 text-[12px]">답변을 입력해주세요.</p>
          </div>
        ) : (
          <div className="py-3">
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showDate =
                idx === 0 ||
                (prev && !isSameDay(prev.createdAt, msg.createdAt));
              const isMe = msg.senderId === adminId;

              // SYSTEM 메시지
              if (msg.type === "SYSTEM") {
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center py-4">
                        <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-gray-500">
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center py-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] text-gray-500">
                        {msg.content}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center py-4">
                      <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-gray-500">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex px-4 mb-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* 상대방 아바타 */}
                    {!isMe && (
                      <div className="mr-2 mt-0.5 shrink-0">
                        {shouldShowSender(messages, idx) ? (
                          <div className="flex size-8 items-center justify-center rounded-full bg-[#E8E8E8]">
                            <span className="text-[11px] font-bold text-gray-500">
                              {msg.nickname?.[0]?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                        ) : (
                          <div className="size-8" />
                        )}
                      </div>
                    )}

                    <div
                      className={`flex max-w-[70%] flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* 상대방 이름 */}
                      {!isMe && shouldShowSender(messages, idx) && (
                        <span className="mb-1 ml-1 text-[12px] font-medium text-gray-600">
                          {msg.nickname}
                        </span>
                      )}

                      <div
                        className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        {/* 메시지 버블 */}
                        {msg.type === "IMAGE" ? (
                          <div className="relative h-48 w-48 overflow-hidden rounded-xl">
                            <Image
                              src={msg.content}
                              alt="첨부 이미지"
                              fill
                              className="object-cover"
                              sizes="192px"
                            />
                          </div>
                        ) : (
                          <div
                            className={`break-words px-3.5 py-2.5 text-[14px] leading-5 ${
                              isMe
                                ? "rounded-[16px_4px_16px_16px] bg-[#2DB400] text-white"
                                : "rounded-[4px_16px_16px_16px] bg-[#F2F2F2] text-gray-900"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}

                        {/* 시간 + 읽음 */}
                        {shouldShowTime(messages, idx) && (
                          <div
                            className={`flex shrink-0 flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
                          >
                            {isMe && msg.isRead && (
                              <span className="text-[10px] text-gray-400">
                                읽음
                              </span>
                            )}
                            {isMe && !msg.isRead && (
                              <span className="text-[10px] font-bold text-amber-500">
                                1
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      {isClosed ? (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-3.5 text-center">
          <p className="text-[13px] text-gray-400">종료된 상담입니다.</p>
        </div>
      ) : (
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
          {/* 이미지 첨부 hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="flex items-end gap-2">
            {/* 이미지 첨부 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <Camera className="size-5" />
            </button>

            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 96) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요"
              rows={1}
              className="flex-1 resize-none rounded-xl bg-[#F5F5F5] px-4 py-2.5 text-[14px] leading-5 outline-none transition-colors placeholder:text-gray-400 focus:bg-[#EEEEEE]"
              style={{ maxHeight: 96 }}
            />

            <button
              onClick={handleSend}
              disabled={isSending || !hasText}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                hasText && !isSending
                  ? "bg-[#2DB400] text-white active:scale-95"
                  : "bg-gray-200 text-white"
              }`}
              aria-label="전송"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
