"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessageResponse } from "@/types/chat";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_URL) return process.env.NEXT_PUBLIC_CHAT_URL;
  if (typeof window === "undefined") return "http://localhost:8080";
  return `http://${window.location.hostname}:8080`;
}

export interface ChatListItem {
  id: string;
  user: { nickname: string; image: string | null };
  order: { id: string; totalPrice: number; createdAt: string };
  lastMessage: {
    content: string;
    type: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export function useChatList(
  initialChats: ChatListItem[],
  onNewChat?: () => void,
) {
  const [chats, setChats] = useState<ChatListItem[]>(initialChats);
  const socketRef = useRef<Socket | null>(null);
  const onNewChatRef = useRef(onNewChat);
  onNewChatRef.current = onNewChat;

  const handleNewMessage = useCallback((data: ChatMessageResponse) => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === data.chatId);

      // 새 채팅방에서 온 메시지 → 서버에서 목록 다시 가져오기
      if (idx === -1) {
        setTimeout(() => onNewChatRef.current?.(), 0);
        return prev;
      }

      const updated = [...prev];
      const chat = { ...updated[idx] };
      chat.lastMessage = {
        content: data.content,
        type: data.type,
        createdAt: data.createdAt,
        senderId: data.senderId,
        isRead: data.isRead,
      };
      chat.unreadCount = chat.unreadCount + 1;

      // 해당 채팅을 맨 위로 이동
      updated.splice(idx, 1);
      return [chat, ...updated];
    });
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    try {
      const res = await fetch("/api/chat/token", { method: "POST" });
      if (!res.ok) return;
      const { token } = await res.json();

      const socket = io(`${getSocketUrl()}/chat`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("message:new", handleNewMessage);

      socket.on("message:read_receipt", (data: { chatId: string }) => {
        setChats((prev) =>
          prev.map((c) =>
            c.id === data.chatId ? { ...c, unreadCount: 0 } : c
          )
        );
      });
    } catch {
      // 연결 실패 시 무시 — 초기 데이터로 동작
    }
  }, [handleNewMessage]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  // 탭 복귀 시 재연결
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        !socketRef.current?.connected
      ) {
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [connect]);

  return chats;
}
