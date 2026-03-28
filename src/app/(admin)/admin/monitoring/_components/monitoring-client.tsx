"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, Clock, AlertCircle, RefreshCw, MapPin } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { MonitoringData } from "../actions";

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "매칭 대기",
  ACCEPTED: "수락",
  AT_STORE: "가게 도착",
  PICKED_UP: "픽업 완료",
  DELIVERING: "배달 중",
};

const DELIVERY_STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-orange-100 text-orange-600",
  ACCEPTED: "bg-blue-100 text-blue-600",
  AT_STORE: "bg-purple-100 text-purple-600",
  PICKED_UP: "bg-cyan-100 text-cyan-600",
  DELIVERING: "bg-green-100 text-green-600",
};

interface Props {
  initialData: MonitoringData;
}

export function MonitoringClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center justify-between px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-white/80 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">배달 현황</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <div className="flex-1 px-3 py-3 space-y-3">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-3 text-center">
            <Truck className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 text-xl font-bold text-gray-900">
              {initialData.activeDeliveryCount}
            </p>
            <p className="text-[11px] text-gray-500">실시간 배달</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center">
            <AlertCircle className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-xl font-bold text-gray-900">
              {initialData.pendingMatchCount}
            </p>
            <p className="text-[11px] text-gray-500">매칭 대기</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center">
            <Clock className="mx-auto h-5 w-5 text-green-500" />
            <p className="mt-1 text-xl font-bold text-gray-900">
              {initialData.avgMatchingTimeMinutes !== null
                ? `${initialData.avgMatchingTimeMinutes}분`
                : "-"}
            </p>
            <p className="text-[11px] text-gray-500">평균 매칭</p>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-gray-200">
          <MapPin className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-500">
            지도 영역 (카카오맵 연동 예정)
          </p>
          <p className="text-xs text-gray-400">
            기사 위치 및 배달 경로가 표시됩니다
          </p>
        </div>

        {/* Active Delivery List */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">
            활성 배달 목록 ({initialData.activeDeliveryCount}건)
          </h3>
          {initialData.activeDeliveries.length === 0 ? (
            <div className="px-4 pb-4 text-center text-sm text-gray-500">
              현재 진행 중인 배달이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 px-4 pb-4">
              {initialData.activeDeliveries.map((delivery) => (
                <div key={delivery.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {delivery.riderNickname || "미배정"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          DELIVERY_STATUS_COLORS[delivery.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {DELIVERY_STATUS_LABELS[delivery.status] || delivery.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(delivery.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {delivery.restaurantName} → {delivery.customerNickname}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 truncate">
                    {delivery.deliveryAddress}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
