"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface DeliveryInfoProps {
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
}

type TabType = "delivery" | "pickup" | "info";

export function DeliveryInfo({
  minOrderAmount,
  deliveryFee,
  deliveryTime,
}: DeliveryInfoProps) {
  const [activeTab, setActiveTab] = useState<TabType>("delivery");

  const tabs: { key: TabType; label: string; disabled?: boolean }[] = [
    { key: "delivery", label: "배달" },
    { key: "pickup", label: "픽업" },
    { key: "info", label: "배달 안내" },
  ];

  return (
    <div>
      {/* 탭 헤더 - 배민 스타일 */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setActiveTab(tab.key)}
            className={cn(
              "relative flex-1 py-3 text-center text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-black"
                : "text-gray-400"
            )}
          >
            {tab.label}
            {tab.key === "pickup" && (
              <span className="ml-1 text-xs text-muted-foreground">
                {deliveryTime - 10 > 0 ? `${deliveryTime - 10}~${deliveryTime}분` : `${deliveryTime}분`}
              </span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* 배달 정보 내용 */}
      {activeTab === "delivery" && (
        <div className="space-y-0 pt-3">
          {/* 최소주문 */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">최소주문</span>
            <span className="text-sm font-medium">
              {minOrderAmount.toLocaleString()}원
            </span>
          </div>

          {/* 알뜰배달 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">알뜰배달</span>
              <span className="text-sm text-gray-400">
                {deliveryTime + 5}~{deliveryTime + 16}분
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-[#2DB400]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2DB400]">
                가장 저렴해요
              </span>
              <span className="text-sm font-medium">
                {deliveryFee > 0
                  ? `${deliveryFee.toLocaleString()}원`
                  : "무료"}
              </span>
              {deliveryFee > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {(deliveryFee + 500).toLocaleString()}원
                </span>
              )}
            </div>
          </div>

          {/* 한집배달 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">한집배달</span>
              <span className="text-sm text-gray-400">
                {deliveryTime - 5 > 0 ? deliveryTime - 5 : deliveryTime}~{deliveryTime}분
              </span>
            </div>
            <span className="text-sm font-medium">
              {(deliveryFee + 1000).toLocaleString()}원
              <span className="ml-1 text-xs text-gray-400 line-through">
                {(deliveryFee + 2000).toLocaleString()}원
              </span>
            </span>
          </div>

          {/* 가게배달비 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">가게배달비</span>
              <span className="inline-flex items-center gap-0.5 text-sm text-gray-400">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {deliveryTime}~{deliveryTime + 10}분
              </span>
            </div>
            <span className="text-sm font-medium">
              0~{(deliveryFee + 3000).toLocaleString()}원
            </span>
          </div>
        </div>
      )}

      {activeTab === "pickup" && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          포장 주문은 준비 중입니다
        </div>
      )}

      {activeTab === "info" && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          배달 안내 정보가 없습니다
        </div>
      )}
    </div>
  );
}
