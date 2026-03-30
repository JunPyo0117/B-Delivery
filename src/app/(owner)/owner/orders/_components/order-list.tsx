"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { Centrifuge } from "centrifuge";
import { OrderStatus } from "@/generated/prisma/enums";
import { getOwnerOrders, type OwnerOrder } from "../_actions/get-orders";
import { OrderCard } from "./order-card";
import { cn } from "@/shared/lib/utils";
import { Bell, RefreshCw } from "lucide-react";

type TabFilter = "PENDING" | "COOKING" | "PICKED_UP" | "DONE";

const TABS: { value: TabFilter; label: string }[] = [
  { value: "PENDING", label: "신규 주문" },
  { value: "COOKING", label: "처리중" },
  { value: "DONE", label: "완료" },
];

interface OrderListProps {
  initialOrders: OwnerOrder[];
  restaurantName: string;
}

export function OrderList({ initialOrders, restaurantName }: OrderListProps) {
  const [orders, setOrders] = useState<OwnerOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<TabFilter>("PENDING");
  const [isPending, startTransition] = useTransition();
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const fetchOrders = useCallback(() => {
    startTransition(async () => {
      const result = await getOwnerOrders("ALL");
      if (!result.error) {
        setOrders(result.orders);
      }
    });
  }, []);

  // 현재 주문 수를 ref로 추적
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const centrifugeRef = useRef<Centrifuge | null>(null);

  // Centrifugo WebSocket 연결 — owner_orders# 채널에서 실시간 주문 알림 수신
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_CENTRIFUGO_URL;
    if (!wsUrl) return;

    const centrifuge = new Centrifuge(wsUrl, {
      getToken: async () => {
        const res = await fetch("/api/chat/token", { method: "POST" });
        if (!res.ok) throw new Error("Centrifugo 토큰 발급 실패");
        const data = await res.json();
        return data.token as string;
      },
    });

    centrifugeRef.current = centrifuge;

    // 서버 사이드 구독 채널(owner_orders#<userId>)의 publication 수신
    centrifuge.on("publication", (ctx: { data: unknown }) => {
      const data = ctx.data as {
        orderId?: string;
        newStatus?: string;
      };

      if (data.orderId) {
        // 신규 PENDING 주문 감지 시 알림 표시
        if (data.newStatus === "PENDING") {
          setNewOrderAlert(true);
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("B-Delivery", {
              body: "새로운 주문이 들어왔습니다!",
            });
          }
        }

        // 주문 목록 갱신
        startTransition(async () => {
          const result = await getOwnerOrders("ALL");
          if (!result.error) {
            setOrders(result.orders);
          }
        });
      }
    });

    centrifuge.connect();

    return () => {
      centrifuge.disconnect();
      centrifugeRef.current = null;
    };
  }, []);

  // Fallback: 60초마다 폴링 (WebSocket 연결 실패 대비)
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getOwnerOrders("ALL");
      if (!result.error) {
        const currentPendingCount = ordersRef.current.filter(
          (o) => o.status === "PENDING"
        ).length;
        const newPendingCount = result.orders.filter(
          (o) => o.status === "PENDING"
        ).length;

        if (newPendingCount > currentPendingCount) {
          setNewOrderAlert(true);
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("B-Delivery", {
              body: `새로운 주문이 ${newPendingCount - currentPendingCount}건 들어왔습니다!`,
            });
          }
        }

        setOrders(result.orders);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  const filteredOrders = (() => {
    switch (activeTab) {
      case "PENDING":
        return orders.filter((o) => o.status === "PENDING");
      case "COOKING":
        return orders.filter(
          (o) => o.status === "COOKING" || o.status === "PICKED_UP"
        );
      case "DONE":
        return orders.filter(
          (o) => o.status === "DONE" || o.status === "CANCELLED"
        );
      default:
        return orders;
    }
  })();

  function handleTabChange(tab: TabFilter) {
    setActiveTab(tab);
    setNewOrderAlert(false);
  }

  return (
    <div>
      {/* Green header */}
      <div className="px-4 pt-4 pb-0" style={{ backgroundColor: "#2DB400" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">주문 관리</h1>
            <p className="text-xs text-white/70 mt-0.5">{restaurantName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={isPending}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <RefreshCw
                className={cn(
                  "h-5 w-5 text-white",
                  isPending && "animate-spin"
                )}
              />
            </button>
            <div className="relative p-2">
              <Bell className="h-5 w-5 text-white" />
              {pendingCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#FF5252" }}
                >
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar on green bg */}
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold text-center transition-colors relative",
                  isActive ? "text-white" : "text-white/50"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 신규 주문 알림 배너 */}
      {newOrderAlert && (
        <div
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl p-3 text-sm font-medium cursor-pointer animate-pulse"
          style={{ backgroundColor: "#FFEBEE", color: "#FF5252" }}
          onClick={() => {
            handleTabChange("PENDING");
            setNewOrderAlert(false);
          }}
        >
          <Bell className="h-4 w-4" />
          <span>새로운 주문이 들어왔습니다!</span>
        </div>
      )}

      {/* 주문 목록 */}
      <div className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ClipboardIcon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">
              {activeTab === "PENDING"
                ? "신규 주문이 없습니다."
                : activeTab === "COOKING"
                  ? "처리중인 주문이 없습니다."
                  : "완료된 주문이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* 대기 주문 요약 (하단 고정) */}
      {pendingCount > 0 && activeTab !== "PENDING" && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => handleTabChange("PENDING")}
            className="w-full rounded-xl text-white py-3.5 px-4 text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: "#FF5252" }}
          >
            <Bell className="h-4 w-4" />
            대기중인 주문 {pendingCount}건
          </button>
        </div>
      )}
    </div>
  );
}

/** Simple clipboard icon for empty state */
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}
