"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { OrderStatus } from "@/generated/prisma/enums";
import { getOwnerOrders, type OwnerOrder } from "../_actions/get-orders";
import { OrderCard } from "./order-card";
import { cn } from "@/lib/utils";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabFilter = "ALL" | OrderStatus;

const TABS: { value: TabFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "신규" },
  { value: "COOKING", label: "조리중" },
  { value: "PICKED_UP", label: "배달중" },
  { value: "DONE", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

interface OrderListProps {
  initialOrders: OwnerOrder[];
}

export function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<OwnerOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
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

  // 현재 주문 수를 ref로 추적 (interval 재생성 방지)
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // 30초마다 자동 새로고침 (폴링 기반 실시간 알림)
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getOwnerOrders("ALL");
      if (!result.error) {
        // 신규 주문 감지
        const currentPendingCount = ordersRef.current.filter(
          (o) => o.status === "PENDING"
        ).length;
        const newPendingCount = result.orders.filter(
          (o) => o.status === "PENDING"
        ).length;

        if (newPendingCount > currentPendingCount) {
          setNewOrderAlert(true);
          // 브라우저 알림
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("B-Delivery", {
              body: `새로운 주문이 ${newPendingCount - currentPendingCount}건 들어왔습니다!`,
            });
          }
        }

        setOrders(result.orders);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  const filteredOrders =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  function handleTabChange(tab: TabFilter) {
    setActiveTab(tab);
    setNewOrderAlert(false);
  }

  return (
    <div className="space-y-4">
      {/* 신규 주문 알림 배너 */}
      {newOrderAlert && (
        <div
          className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 cursor-pointer animate-pulse"
          onClick={() => {
            handleTabChange("PENDING");
            setNewOrderAlert(false);
          }}
        >
          <Bell className="h-4 w-4" />
          <span className="font-medium">새로운 주문이 들어왔습니다!</span>
        </div>
      )}

      {/* 탭 필터 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count =
            tab.value === "ALL"
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
                    activeTab === tab.value
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600",
                    tab.value === "PENDING" &&
                      activeTab !== "PENDING" &&
                      count > 0 &&
                      "bg-red-500 text-white"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchOrders}
          disabled={isPending}
          className="text-muted-foreground"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-1", isPending && "animate-spin")}
          />
          새로고침
        </Button>
      </div>

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {activeTab === "ALL"
              ? "아직 주문이 없습니다."
              : `${TABS.find((t) => t.value === activeTab)?.label} 주문이 없습니다.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={fetchOrders}
            />
          ))}
        </div>
      )}

      {/* 대기 주문 요약 (하단 고정) */}
      {pendingCount > 0 && activeTab !== "PENDING" && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => handleTabChange("PENDING")}
            className="w-full rounded-xl bg-red-500 text-white py-3 px-4 text-sm font-semibold shadow-lg flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
          >
            <Bell className="h-4 w-4" />
            대기중인 주문 {pendingCount}건
          </button>
        </div>
      )}
    </div>
  );
}
