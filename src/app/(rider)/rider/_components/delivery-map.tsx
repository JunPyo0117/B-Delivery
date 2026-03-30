"use client";

import { KakaoMap } from "@/shared/ui/kakao-map";

interface DeliveryMapProps {
  lat: number;
  lng: number;
}

/**
 * 기사 현재 위치 카카오맵
 */
export function DeliveryMap({ lat, lng }: DeliveryMapProps) {
  // 위치가 없거나 기본값(0,0)이면 placeholder
  if (!lat && !lng) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
        <p className="text-[13px] text-gray-400">위치 정보를 가져오는 중...</p>
      </div>
    );
  }

  return (
    <KakaoMap
      lat={lat}
      lng={lng}
      level={4}
      markers={[{ lat, lng, label: "내 위치" }]}
      className="h-[200px] rounded-2xl"
    />
  );
}
