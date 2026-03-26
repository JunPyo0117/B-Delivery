"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useChatStore } from "@/stores/chat";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { Loader2 } from "lucide-react";
import type { PendingMessage } from "@/types/chat";

interface MessageListProps {
  chatId: string;
  currentUserId: string;
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** 같은 사람이 1분 이내로 보낸 메시지 그룹에서 마지막 메시지만 시간 표시 */
function shouldShowTime(msgs: PendingMessage[], idx: number) {
  const current = msgs[idx];
  const next = msgs[idx + 1];
  if (!next) return true;
  if (next.senderId !== current.senderId) return true;
  const diff = new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime();
  return diff > 60_000;
}

/** 발신자가 바뀌었거나 첫 메시지일 때 sender 표시 */
function shouldShowSender(msgs: PendingMessage[], idx: number) {
  const current = msgs[idx];
  if (idx === 0) return true;
  const prev = msgs[idx - 1];
  if (!prev) return true;
  if (prev.senderId !== current.senderId) return true;
  // 날짜가 바뀌면 다시 표시
  if (!isSameDay(prev.createdAt, current.createdAt)) return true;
  return false;
}

export function MessageList({ chatId, currentUserId }: MessageListProps) {
  const messages = useChatStore((s) => s.messages[chatId] ?? []);
  const typingUsers = useChatStore((s) => s.typingUsers[chatId] ?? []);
  const hasMore = useChatStore((s) => s.hasMore[chatId] ?? true);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setHasMore = useChatStore((s) => s.setHasMore);

  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinel = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 자동 스크롤: 새 메시지가 올 때 하단에 있으면 스크롤
  useEffect(() => {
    if (isAtBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // 초기 마운트 시 하단으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // 스크롤 위치 추적
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  // 무한 스크롤: 상단 감지
  useEffect(() => {
    const sentinel = topSentinel.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loadingMore || !hasMore) return;

        const firstMsg = messages[0];
        if (!firstMsg) return;

        setLoadingMore(true);
        const prevHeight = container.scrollHeight;

        try {
          const res = await fetch(
            `/api/chat/${chatId}/messages?cursor=${encodeURIComponent(firstMsg.createdAt)}&limit=50`
          );
          if (!res.ok) throw new Error();
          const { messages: older, nextCursor } = await res.json();

          if (older.length > 0) {
            prependMessages(chatId, older);
          }
          setHasMore(chatId, nextCursor !== null);

          // 스크롤 위치 보정
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevHeight;
            }
          });
        } catch {
          // 에러 시 무시
        } finally {
          setLoadingMore(false);
        }
      },
      { root: container, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [chatId, messages, loadingMore, hasMore, prependMessages, setHasMore]);

  const showTyping = typingUsers.filter((id) => id !== currentUserId).length > 0;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
    >
      {/* 상단 감지 요소 */}
      <div ref={topSentinel} className="h-1" />

      {loadingMore && (
        <div className="flex justify-center py-3">
          <Loader2 className="size-5 animate-spin text-gray-400" />
        </div>
      )}

      <div className="py-3">
        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const showDate =
            idx === 0 || (prev && !isSameDay(prev.createdAt, msg.createdAt));
          const isOwn = msg.senderId === currentUserId || msg.senderId === "__self__";

          return (
            <div key={msg._tempId ?? msg.id}>
              {showDate && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                showTime={shouldShowTime(messages, idx)}
                showSender={!isOwn && shouldShowSender(messages, idx)}
              />
            </div>
          );
        })}
      </div>

      {showTyping && <TypingIndicator />}
    </div>
  );
}
