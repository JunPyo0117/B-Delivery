"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/stores/chat";
import type {
  ChatMessageResponse,
  TypingEvent,
  ReadReceiptEvent,
} from "@/types/chat";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_URL) return process.env.NEXT_PUBLIC_CHAT_URL;
  if (typeof window === "undefined") return "http://localhost:8080";
  return `http://${window.location.hostname}:8080`;
}

export function useSocket(chatId: string) {
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useChatStore;

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/token", { method: "POST" });
      if (!res.ok) throw new Error("토큰 발급 실패");
      const { token } = await res.json();

      const socket = io(`${getSocketUrl()}/chat`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        socket.emit("room:join", { chatId });
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setIsConnecting(false);
        setError(err.message || "연결 오류가 발생했습니다.");
      });

      socket.on("message:new", (data: ChatMessageResponse) => {
        if (data.chatId === chatId) {
          store.getState().addMessage(chatId, data);
          socket.emit("message:read", { chatId });
        }
      });

      socket.on("typing:update", (data: TypingEvent) => {
        if (data.chatId === chatId) {
          store.getState().setTyping(chatId, data.userId, data.isTyping);
        }
      });

      socket.on("message:read_receipt", (data: ReadReceiptEvent) => {
        if (data.chatId === chatId) {
          store.getState().markAsRead(chatId);
        }
      });
    } catch (err) {
      setIsConnecting(false);
      setError(err instanceof Error ? err.message : "연결 실패");
    }
  }, [chatId, store]);

  const sendMessage = useCallback(
    (type: "TEXT" | "IMAGE", content: string) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // optimistic 추가
      store.getState().addMessage(chatId, {
        id: tempId,
        chatId,
        senderId: "__self__",
        nickname: "",
        type,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        _pending: true,
        _tempId: tempId,
      });

      // ack 콜백으로 서버 확인 수신
      socketRef.current?.emit(
        "message:send",
        { chatId, type, content },
        (ack: { id: string; createdAt: string }) => {
          store.getState().confirmMessage(tempId, ack);
        }
      );
    },
    [chatId, store]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socketRef.current?.emit(
        isTyping ? "typing:start" : "typing:stop",
        { chatId }
      );
      if (isTyping) {
        typingTimer.current = setTimeout(() => {
          socketRef.current?.emit("typing:stop", { chatId });
        }, 2000);
      }
    },
    [chatId]
  );

  const sendRead = useCallback(() => {
    socketRef.current?.emit("message:read", { chatId });
  }, [chatId]);

  // 연결/해제 생명주기
  useEffect(() => {
    connect();
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
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

  return { isConnected, isConnecting, error, sendMessage, sendTyping, sendRead };
}
