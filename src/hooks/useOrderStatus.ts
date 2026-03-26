"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useOrderStore } from "@/stores/order";
import type { OrderUpdateEvent, OrderStatus } from "@/types/order";

/**
 * WebSocket 메시지 타입 (Go chat-server의 models.WSMessage와 매핑)
 * type: "order_update" 만 처리
 */
interface WSOrderMessage {
  type: "order_update";
  payload: OrderUpdateEvent;
}

function getWsUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_WS_URL) return process.env.NEXT_PUBLIC_CHAT_WS_URL;
  if (typeof window === "undefined") return "ws://localhost:8080/ws";
  return `ws://${window.location.hostname}:8080/ws`;
}
const WS_URL = getWsUrl();
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export interface UseOrderStatusOptions {
  /** 자동 연결 여부 (기본: true) */
  enabled?: boolean;
  /** 상태 변경 시 콜백 */
  onStatusChange?: (event: OrderUpdateEvent) => void;
}

export interface UseOrderStatusReturn {
  /** WebSocket 연결 상태 */
  isConnected: boolean;
  /** 연결 시도 중 여부 */
  isConnecting: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 특정 주문의 현재 상태 조회 */
  getOrderStatus: (orderId: string) => OrderStatus | undefined;
  /** 수동 연결 */
  connect: () => void;
  /** 수동 연결 해제 */
  disconnect: () => void;
}

/**
 * 주문 상태 실시간 업데이트를 위한 WebSocket 클라이언트 훅.
 *
 * Go 채팅 서버의 WebSocket 엔드포인트에 연결하여
 * Redis Stream -> Go 서버 -> WebSocket 경로로 전달되는
 * `order_update` 이벤트를 수신하고 Zustand 스토어를 업데이트합니다.
 *
 * @example
 * ```tsx
 * const { isConnected, getOrderStatus } = useOrderStatus({
 *   onStatusChange: (event) => {
 *     toast(`주문 ${event.orderId}: ${ORDER_STATUS_LABEL[event.newStatus]}`);
 *   },
 * });
 * ```
 */
export function useOrderStatus(
  options: UseOrderStatusOptions = {}
): UseOrderStatusReturn {
  const { enabled = true, onStatusChange } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);
  const onStatusChangeRef = useRef(onStatusChange);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyOrderUpdate = useOrderStore((s) => s.applyOrderUpdate);

  // 콜백 ref 최신화 (리렌더링 없이 최신 콜백 참조)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: WSOrderMessage = JSON.parse(event.data);

        if (msg.type !== "order_update") return;

        const orderEvent = msg.payload;
        if (!orderEvent.orderId || !orderEvent.newStatus) return;

        // Zustand 스토어 업데이트
        applyOrderUpdate(orderEvent);

        // 콜백 호출
        onStatusChangeRef.current?.(orderEvent);
      } catch {
        // order_update 이외의 메시지(chat_message 등)는 무시
      }
    },
    [applyOrderUpdate]
  );

  const disconnect = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    }
    retryCount.current = MAX_RETRIES; // 재연결 방지
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async () => {
    // 이미 연결 중이거나 연결된 경우
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    if (!mountedRef.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // JWT 토큰 발급 (채팅 서버 인증용)
      const res = await fetch("/api/chat/token", { method: "POST" });
      if (!res.ok) {
        throw new Error("인증 토큰 발급에 실패했습니다.");
      }
      const { token } = await res.json();

      if (!mountedRef.current) return;

      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        retryCount.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onclose = (e) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // 정상 종료(1000)가 아니고 마운트 상태면 재연결 시도
        if (mountedRef.current && e.code !== 1000) {
          maybeReconnect();
        }
      };

      ws.onerror = () => {
        setError("WebSocket 연결 오류가 발생했습니다.");
      };
    } catch (err) {
      if (!mountedRef.current) return;
      setIsConnecting(false);
      setError(
        err instanceof Error ? err.message : "WebSocket 연결에 실패했습니다."
      );
      maybeReconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMessage]);

  const maybeReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (retryCount.current >= MAX_RETRIES) {
      setError("연결이 끊어졌습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const delay = Math.min(
      BASE_DELAY_MS * 2 ** retryCount.current + Math.random() * 500,
      MAX_DELAY_MS
    );
    retryCount.current++;

    retryTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  // 특정 주문 상태 조회 헬퍼
  const getOrderStatus = useCallback(
    (orderId: string): OrderStatus | undefined => {
      return useOrderStore.getState().orders[orderId]?.status;
    },
    []
  );

  // 연결/해제 lifecycle
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = undefined;
      }
      // 언마운트 시 재연결 방지 후 종료
      retryCount.current = MAX_RETRIES;
      if (wsRef.current) {
        wsRef.current.close(1000, "component unmounted");
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);

  // 탭 복귀 시 재연결
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        !wsRef.current &&
        mountedRef.current
      ) {
        retryCount.current = 0;
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, connect]);

  // 네트워크 복구 시 재연결
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      if (!wsRef.current && mountedRef.current) {
        retryCount.current = 0;
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [enabled, connect]);

  return {
    isConnected,
    isConnecting,
    error,
    getOrderStatus,
    connect,
    disconnect,
  };
}
