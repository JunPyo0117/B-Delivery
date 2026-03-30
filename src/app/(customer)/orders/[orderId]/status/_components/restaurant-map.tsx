"use client";

import { useEffect, useRef, useState } from "react";

interface RestaurantMapProps {
  latitude: number;
  longitude: number;
  restaurantName: string;
}

export function RestaurantMap({
  latitude,
  longitude,
  restaurantName,
}: RestaurantMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!kakaoMapKey) {
      setError("카카오 맵 API 키가 설정되지 않았습니다.");
      return;
    }

    // 이미 카카오 SDK가 로드되어 있는 경우
    if (window.kakao?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };

    script.onerror = () => {
      setError("카카오 맵을 불러오는데 실패했습니다.");
    };

    document.head.appendChild(script);

    return () => {
      // 스크립트는 제거하지 않음 (다른 컴포넌트에서 재사용)
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;

    const { kakao } = window;
    const position = new kakao.maps.LatLng(latitude, longitude);

    const map = new kakao.maps.Map(mapContainerRef.current, {
      center: position,
      level: 4,
    });

    // 음식점 마커
    new kakao.maps.Marker({
      position,
      map,
    });

    // 음식점 이름 오버레이
    new kakao.maps.CustomOverlay({
      position,
      content: `
        <div style="
          padding: 4px 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #333;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          white-space: nowrap;
          transform: translateY(-8px);
        ">
          ${restaurantName}
        </div>
      `,
      yAnchor: 2.5,
      map,
    });
  }, [isLoaded, latitude, longitude, restaurantName]);

  if (error) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden relative">
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <p className="text-sm text-muted-foreground">지도 로딩중...</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
