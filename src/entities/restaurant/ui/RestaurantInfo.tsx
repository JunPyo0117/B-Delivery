"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { RestaurantDetailData } from "../model/types";

interface RestaurantInfoProps {
  restaurant: RestaurantDetailData;
}

export function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
  const {
    name,
    category,
    imageUrl,
    rating,
    reviewCount,
    deliveryTime,
    deliveryFee,
    minOrderAmount,
    isOpen,
    openTime,
    closeTime,
    distance,
  } = restaurant;

  const categoryLabel =
    CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;

  return (
    <div className="w-full">
      {/* 음식점 대표 이미지 */}
      {imageUrl && (
        <div className="relative aspect-[2/1] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
        {/* 음식점 이름 + 카테고리 */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{name}</h1>
          <Badge variant="secondary" className="text-xs">
            {categoryLabel}
          </Badge>
        </div>

        {/* 평점, 리뷰 수 */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-yellow-500 font-semibold">
            ★ {rating > 0 ? rating.toFixed(1) : "-"}
          </span>
          {reviewCount > 0 && (
            <span className="text-muted-foreground">
              ({reviewCount.toLocaleString()})
            </span>
          )}
        </div>

        {/* 영업 상태 + 영업시간 */}
        <div className="flex items-center gap-2 text-sm">
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={
              isOpen
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }
          >
            {isOpen ? "영업 중" : "영업 종료"}
          </Badge>
          {openTime && closeTime && (
            <span className="text-muted-foreground">
              {openTime} ~ {closeTime}
            </span>
          )}
        </div>

        {/* 배달 정보 */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground border-t pt-3">
          <div>
            <span className="font-medium text-foreground">최소주문</span>{" "}
            {minOrderAmount.toLocaleString()}원
          </div>
          <div>
            <span className="font-medium text-foreground">배달비</span>{" "}
            {deliveryFee > 0 ? `${deliveryFee.toLocaleString()}원` : "무료"}
          </div>
          <div>
            <span className="font-medium text-foreground">배달시간</span>{" "}
            {deliveryTime}분
          </div>
          {distance !== undefined && (
            <div>
              <span className="font-medium text-foreground">거리</span>{" "}
              {distance}km
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
