"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Send, Loader2, MessageCircle, Headphones } from "lucide-react";
import { ChatBubble } from "./chat-bubble";
import {
  getChatMessages,
  sendMessage,
  markAsRead,
  type OwnerChatMessage,
} from "../_actions/chat-actions";

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

/** 같은 사람이 1분 이내로 보낸 메시지 그룹에서 마지막 메시지만 시간 표시 */
function shouldShowTime(msgs: OwnerChatMessage[], idx: number) {
  const current = msgs[idx];
  const next = msgs[idx + 1];
  if (!next) return true;
  if (next.senderId !== current.senderId) return true;
  const diff =
    new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime();
  return diff > 60_000;
}

/** 발신자가 바뀌었거나 첫 메시지일 때 sender 표시 */
function shouldShowSender(msgs: OwnerChatMessage[], idx: number) {
  if (idx === 0) return true;
  const prev = msgs[idx - 1];
  if (prev.senderId !== msgs[idx].senderId) return true;
  if (!isSameDay(prev.createdAt, msgs[idx].createdAt)) return true;
  return false;
}

// ─── Status Badge ────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "WAITING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
          대기중
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
          상담중
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
          종료
        </span>
      );
    default:
      return null;
  }
}

// ─── Props ───────────────────────────────────────────────

interface ChatRoomProps {
  chatId: string;
  currentUserId: string;
  category: string | null;
  status: string;
  initialMessages: OwnerChatMessage[];
}

// ─── Component ───────────────────────────────────────────

export function ChatRoom({
  chatId,
  currentUserId,
  category,
  status,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<OwnerChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottom = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 하단으로 스크롤
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // 초기 마운트 시 하단 스크롤 + 읽음 처리
  useEffect(() => {
    scrollToBottom();
    markAsRead(chatId);
  }, [chatId, scrollToBottom]);

  // 새 메시지 도착 시 하단에 있으면 스크롤
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
        setMessages((prev) => {
          // 새 메시지만 추가 (기존 ID와 비교)
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = result.messages.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            // 읽음 처리
            markAsRead(chatId);
            return [...prev, ...newMsgs];
          }
          // 읽음 상태 업데이트 확인
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

    // Optimistic: 즉시 UI에 추가
    const tempMsg: OwnerChatMessage = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: currentUserId,
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
        // temp 메시지를 실제 메시지로 교체
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? result.message! : m))
        );
      } else {
        // 실패 시 temp 메시지 제거
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, isSending, chatId, currentUserId]);

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

  const isClosed = status === "CLOSED";
  const hasText = inputText.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* 헤더 */}
      <header className="flex items-center justify-between h-14 px-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Headphones className="size-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">
              {category || "고객센터 문의"}
            </h2>
          </div>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#F8F8F8]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="size-10 mb-2" />
            <p className="text-[13px]">메시지가 없습니다.</p>
            <p className="text-[12px] mt-0.5">문의 내용을 입력해주세요.</p>
          </div>
        ) : (
          <div className="py-3">
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showDate =
                idx === 0 ||
                (prev && !isSameDay(prev.createdAt, msg.createdAt));
              const isMe = msg.senderId === currentUserId;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center py-4">
                      <span className="px-3 py-1 rounded-full bg-black/5 text-[11px] text-gray-500 font-medium">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <ChatBubble
                    content={msg.content}
                    timestamp={msg.createdAt}
                    isMe={isMe}
                    isRead={msg.isRead}
                    showTime={shouldShowTime(messages, idx)}
                    showSender={!isMe && shouldShowSender(messages, idx)}
                    senderName={msg.nickname}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      {isClosed ? (
        <div className="shrink-0 px-5 py-3.5 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[13px] text-gray-400">종료된 상담입니다.</p>
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // auto-resize (max 4줄)
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 96) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요"
              rows={1}
              className="flex-1 resize-none rounded-xl bg-[#F5F5F5] px-4 py-2.5 text-[14px] leading-5 outline-none
                focus:bg-[#EEEEEE] placeholder:text-gray-400 transition-colors"
              style={{ maxHeight: 96 }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !hasText}
              className={`size-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
                ${
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

// ─── Empty State ─────────────────────────────────────────

export function ChatRoomEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white border-l border-gray-200">
      <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <MessageCircle className="size-8 text-gray-300" />
      </div>
      <p className="text-[15px] font-medium text-gray-500">
        채팅을 선택해주세요
      </p>
      <p className="text-[13px] text-gray-400 mt-1">
        왼쪽 목록에서 상담을 선택하거나 새 상담을 시작하세요
      </p>
    </div>
  );
}
