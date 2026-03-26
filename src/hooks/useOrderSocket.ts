"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useOrderStore } from "@/stores/order";
import type { OrderUpdateEvent, OrderStatus } from "@/types/order";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_URL) return process.env.NEXT_PUBLIC_CHAT_URL;
  if (typeof window === "undefined") return "http://localhost:8080";
  return `http://${window.location.hostname}:8080`;
}

export interface UseOrderSocketOptions {
  enabled?: boolean;
  onStatusChange?: (event: OrderUpdateEvent) => void;
}

export interface UseOrderSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  getOrderStatus: (orderId: string) => OrderStatus | undefined;
  connect: () => void;
  disconnect: () => void;
}

export function useOrderSocket(
  options: UseOrderSocketOptions = {}
): UseOrderSocketReturn {
  const { enabled = true, onStatusChange } = options;

  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const onStatusChangeRef = useRef(onStatusChange);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyOrderUpdate = useOrderStore((s) => s.applyOrderUpdate);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;
    if (!mountedRef.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/token", { method: "POST" });
      if (!res.ok) throw new Error("인증 토큰 발급에 실패했습니다.");
      const { token } = await res.json();

      if (!mountedRef.current) return;

      const socket = io(`${getSocketUrl()}/order`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mountedRef.current) {
          socket.disconnect();
          return;
        }
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setIsConnecting(false);
        setError(err.message || "연결 오류가 발생했습니다.");
      });

      socket.on("status:changed", (event: OrderUpdateEvent) => {
        if (!event.orderId || !event.newStatus) return;
        applyOrderUpdate(event);
        onStatusChangeRef.current?.(event);
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setIsConnecting(false);
      setError(
        err instanceof Error ? err.message : "연결에 실패했습니다."
      );
    }
  }, [applyOrderUpdate]);

  const getOrderStatus = useCallback(
    (orderId: string): OrderStatus | undefined => {
      return useOrderStore.getState().orders[orderId]?.status;
    },
    []
  );

  // 연결/해제 lifecycle
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled, connect]);

  // 탭 복귀 시 재연결
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        !socketRef.current?.connected &&
        mountedRef.current
      ) {
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
      if (!socketRef.current?.connected && mountedRef.current) connect();
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
