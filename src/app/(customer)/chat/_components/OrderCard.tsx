"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChatOrderItem } from "@/types/chat";

interface OrderCardProps {
  order: ChatOrderItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 이미 채팅방이 있으면 바로 이동
      if (order.chatId) {
        router.push(`/chat/${order.chatId}`);
        return;
      }

      // 채팅방 생성
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });

      if (!res.ok) throw new Error("채팅방 생성 실패");
      const { chatId } = await res.json();
      router.push(`/chat/${chatId}`);
    } catch {
      setLoading(false);
    }
  };

  const date = new Date(order.createdAt);
  const dateStr = `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, "0")}월 ${String(date.getDate()).padStart(2, "0")}일 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-[#F5F5F5] text-left
        hover:bg-[#EEEEEE] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
    >
      {/* 가게 썸네일 */}
      <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5">
        {order.restaurantImageUrl ? (
          <img
            src={order.restaurantImageUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span className="text-lg">🍗</span>
        )}
      </div>

      {/* 주문 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] text-gray-900 truncate">
          {order.restaurantName}
        </p>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">
          {order.itemSummary} {order.totalPrice.toLocaleString()}원
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="size-4 border-2 border-gray-300 border-t-[#2DB400] rounded-full animate-spin shrink-0" />
      )}
    </button>
  );
}
