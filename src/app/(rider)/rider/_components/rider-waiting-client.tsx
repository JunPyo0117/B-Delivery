"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Centrifuge } from "centrifuge";
import { Bell, BellOff } from "lucide-react";
import {
  DeliveryRequestCard,
  type DeliveryRequest,
} from "./delivery-request-card";

interface RiderWaitingClientProps {
  riderId: string;
  isOnline: boolean;
}

/**
 * 배달 대기 클라이언트 영역
 *
 * - 온라인 상태일 때 Centrifugo `delivery_requests#<riderId>` 채널 구독
 * - 배달 요청 수신 시 DeliveryRequestCard 표시
 */
export function RiderWaitingClient({
  riderId,
  isOnline,
}: RiderWaitingClientProps) {
  const [currentRequest, setCurrentRequest] = useState<DeliveryRequest | null>(
    null
  );
  const centrifugeRef = useRef<Centrifuge | null>(null);

  const handleDismiss = useCallback(() => {
    setCurrentRequest(null);
  }, []);

  // Centrifugo 연결 및 배달 요청 구독
  useEffect(() => {
    if (!riderId || !isOnline) return;

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

    centrifuge.on("connected", (ctx: unknown) => {
      console.log("[Centrifugo] connected", ctx);
    });

    // 서버 사이드 구독 채널(delivery_requests#<riderId>)의 publication 수신
    centrifuge.on("publication", (ctx: { channel?: string; data: unknown }) => {
      console.log("[Centrifugo] publication received", ctx.channel, ctx.data);
      const data = ctx.data as {
        orderId?: string;
        restaurantName?: string;
        pickupLat?: number;
        pickupLng?: number;
        dropoffLat?: number;
        dropoffLng?: number;
        riderFee?: number;
      };

      if (data.orderId && data.restaurantName && typeof data.riderFee === "number") {
        setCurrentRequest({
          orderId: data.orderId,
          restaurantName: data.restaurantName,
          restaurantAddress: "",
          deliveryAddress: "",
          distance: null,
          estimatedTime: null,
          riderFee: data.riderFee,
        });
      }
    });

    centrifuge.connect();

    return () => {
      centrifuge.disconnect();
      centrifugeRef.current = null;
    };
  }, [riderId, isOnline]);

  // 오프라인 상태
  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 py-12 gap-3">
        <BellOff className="size-10 text-gray-300" />
        <p className="text-[14px] text-gray-400 font-medium">오프라인 상태</p>
        <p className="text-[12px] text-gray-400">
          온라인으로 전환하면 배달 요청을 받을 수 있습니다
        </p>
      </div>
    );
  }

  // 배달 요청이 있을 때
  if (currentRequest) {
    return (
      <DeliveryRequestCard
        request={currentRequest}
        onDismiss={handleDismiss}
      />
    );
  }

  // 온라인이지만 요청이 없을 때 — 대기 상태
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-[#2DB400]/5 border border-[#2DB400]/10 py-12 gap-3">
      <div className="relative">
        <Bell className="size-10 text-[#2DB400]" />
        <span className="absolute -top-1 -right-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DB400] opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-[#2DB400]" />
        </span>
      </div>
      <p className="text-[14px] text-[#2DB400] font-medium">
        배달 요청 대기 중...
      </p>
      <p className="text-[12px] text-gray-500">
        주변 배달 요청이 들어오면 알려드립니다
      </p>
    </div>
  );
}
