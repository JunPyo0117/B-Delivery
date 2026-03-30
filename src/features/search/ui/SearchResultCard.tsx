"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { SearchResultItem, SearchMenuMatch } from "../api/searchRestaurants";

interface SearchResultCardProps {
  item: SearchResultItem;
  query: string;
}

/** 검색어를 하이라이트 처리한 텍스트 렌더링 */
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** 매칭된 메뉴 항목 표시 */
function MatchedMenuItem({
  menu,
  query,
}: {
  menu: SearchMenuMatch;
  query: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        <HighlightText text={menu.menuName} highlight={query} />
      </span>
      <span className="font-medium text-foreground">
        {menu.menuPrice.toLocaleString()}원
      </span>
    </div>
  );
}

export function SearchResultCard({ item, query }: SearchResultCardProps) {
  return (
    <Link
      href={`/restaurants/${item.id}`}
      className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
    >
      {/* 음식점 이미지 */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        {/* 음식점명 + 평점 */}
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-sm truncate">
            <HighlightText text={item.name} highlight={query} />
          </h3>
          {item.rating > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{item.rating}</span>
            </div>
          )}
        </div>

        {/* 배달 정보 */}
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.distance !== undefined && `${item.distance}km`}
          {item.distance !== undefined && " · "}
          {item.deliveryTime}분
          {" · "}
          배달비 {item.deliveryFee.toLocaleString()}원
        </p>

        {/* 매칭 메뉴 */}
        {item.matchedMenus.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {item.matchedMenus.slice(0, 2).map((menu) => (
              <MatchedMenuItem key={menu.menuId} menu={menu} query={query} />
            ))}
            {item.matchedMenus.length > 2 && (
              <p className="text-xs text-muted-foreground">
                외 {item.matchedMenus.length - 2}개 메뉴
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
