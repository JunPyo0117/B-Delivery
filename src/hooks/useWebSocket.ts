"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChatStore } from "@/stores/chat";
import type {
  WSMessage,
  ChatMessagePayload,
  ChatMessageResponse,
  MessageAck,
  TypingEvent,
  ReadReceiptEvent,
} from "@/types/chat";

function getWsUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_WS_URL) return process.env.NEXT_PUBLIC_CHAT_WS_URL;
  if (typeof window === "undefined") return "ws://localhost:8080/ws";
  return `ws://${window.location.hostname}:8080/ws`;
}
const MAX_RETRIES = 5;

export function useWebSocket(chatId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTempId = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useChatStore;

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/token", { method: "POST" });
      if (!res.ok) throw new Error("토큰 발급 실패");
      const { token } = await res.json();

      const ws = new WebSocket(`${getWsUrl()}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        retryCount.current = 0;
        // 채팅방 입장 시 읽음 처리
        sendRaw({ type: "read", payload: { chatId } });
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        maybeReconnect();
      };

      ws.onerror = () => {
        setError("연결 오류가 발생했습니다.");
      };
    } catch (err) {
      setIsConnecting(false);
      setError(err instanceof Error ? err.message : "연결 실패");
      maybeReconnect();
    }
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const maybeReconnect = useCallback(() => {
    if (retryCount.current >= MAX_RETRIES) {
      setError("연결이 끊어졌습니다. 페이지를 새로고침해주세요.");
      return;
    }
    const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
    retryCount.current++;
    retryTimer.current = setTimeout(() => connect(), delay);
  }, [connect]);

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      const state = store.getState();
      switch (msg.type) {
        case "chat_message": {
          const data = msg.payload as ChatMessageResponse;
          if (data.chatId === chatId) {
            state.addMessage(chatId, data);
            // 내가 현재 보고 있는 채팅방이면 읽음 처리
            sendRaw({ type: "read", payload: { chatId } });
          }
          break;
        }
        case "message_ack": {
          const ack = msg.payload as MessageAck;
          if (lastTempId.current) {
            state.confirmMessage(lastTempId.current, ack);
            lastTempId.current = null;
          }
          break;
        }
        case "typing": {
          const data = msg.payload as TypingEvent;
          if (data.chatId === chatId) {
            state.setTyping(chatId, data.userId, data.isTyping);
          }
          break;
        }
        case "read_receipt": {
          const data = msg.payload as ReadReceiptEvent;
          if (data.chatId === chatId) {
            state.markAsRead(chatId);
          }
          break;
        }
      }
    },
    [chatId, store]
  );

  const sendRaw = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendMessage = useCallback(
    (type: "TEXT" | "IMAGE", content: string) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      lastTempId.current = tempId;

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

      const payload: ChatMessagePayload = { chatId, type, content };
      sendRaw({ type: "chat_message", payload: payload as unknown });
    },
    [chatId, sendRaw, store]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      // debounce: stop 이벤트는 2초 후 자동 전송
      if (typingTimer.current) clearTimeout(typingTimer.current);
      sendRaw({ type: "typing", payload: { chatId, isTyping } as unknown });
      if (isTyping) {
        typingTimer.current = setTimeout(() => {
          sendRaw({ type: "typing", payload: { chatId, isTyping: false } as unknown });
        }, 2000);
      }
    },
    [chatId, sendRaw]
  );

  const sendRead = useCallback(() => {
    sendRaw({ type: "read", payload: { chatId } as unknown });
  }, [chatId, sendRaw]);

  // 연결/해제 생명주기
  useEffect(() => {
    connect();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      retryCount.current = MAX_RETRIES; // 컴포넌트 언마운트 시 재연결 방지
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  // 탭 복귀 시 재연결
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !wsRef.current) {
        retryCount.current = 0;
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [connect]);

  return { isConnected, isConnecting, error, sendMessage, sendTyping, sendRead };
}
