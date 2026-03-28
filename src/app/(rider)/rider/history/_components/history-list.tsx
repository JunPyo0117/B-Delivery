"use client";

import { Store, MapPin, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { cn, formatPrice, formatDistance } from "@/shared/lib";
type DeliveryStatus = "REQUESTED" | "ACCEPTED" | "AT_STORE" | "PICKED_UP" | "DELIVERING" | "DONE" | "CANCELLED";

interface HistoryItem {
  id: string;
  restaurantName: string;
  deliveryAddress: string;
  distance: number | null;
  riderFee: number;
  completedAt: string;
  status: DeliveryStatus;
}

interface HistoryListProps {
  items: HistoryItem[];
}

/** 날짜 포맷: "2026년 3월 27일 (목)" */
function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

/** 시간 포맷: "14:30" */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 배달 내역 리스트
 * - 날짜별 그룹핑
 * - 카드: 가게명, 배달지, 거리, 배달비, 완료 시간
 */
export function HistoryList({ items }: HistoryListProps) {
  // 날짜별 그룹핑
  const groups = new Map<string, HistoryItem[]>();

  for (const item of items) {
    const key = formatDateGroup(item.completedAt);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groups.entries()).map(([dateLabel, groupItems]) => (
        <div key={dateLabel}>
          {/* 날짜 헤더 */}
          <h2 className="text-[13px] font-semibold text-gray-500 mb-3">
            {dateLabel}
          </h2>

          {/* 카드 목록 */}
          <div className="flex flex-col gap-3">
            {groupItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4"
              >
                {/* 상단: 가게명 + 상태 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-gray-400" />
                    <p className="text-[14px] font-semibold text-gray-900">
                      {item.restaurantName}
                    </p>
                  </div>
                  {item.status === "DONE" ? (
                    <span className="flex items-center gap-1 text-[11px] text-[#2DB400] font-medium">
                      <CheckCircle2 className="size-3.5" />
                      완료
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-[#FF5252] font-medium">
                      <XCircle className="size-3.5" />
                      취소
                    </span>
                  )}
                </div>

                {/* 배달지 */}
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="size-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-gray-500 line-clamp-1">
                    {item.deliveryAddress}
                  </p>
                </div>

                {/* 하단: 거리, 배달비, 시간 */}
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-3 text-gray-500">
                    {item.distance != null && (
                      <span>{formatDistance(item.distance)}</span>
                    )}
                    <span className="font-semibold text-[#2DB400]">
                      {formatPrice(item.riderFee)}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {formatTime(item.completedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
