"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Star, Store, UtensilsCrossed } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import type { SearchResultItem } from "@/types/search";

export function SearchBar() {
  const router = useRouter();
  const { query, setQuery, results, isLoading, isOpen, setIsOpen, clear } =
    useSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  function handleSelect(item: SearchResultItem) {
    setIsOpen(false);
    router.push(`/restaurants/${item.restaurantId}`);
  }

  return (
    <div ref={containerRef} className="relative px-4 py-2 bg-[#2AC1BC]">
      {/* 검색 입력 */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="찾는 맛집 이름이 뭐예요?"
          className="w-full rounded-full bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (query.trim().length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mx-4 mt-1 max-h-[60vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-gray-100">
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">검색 중...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              검색 결과가 없습니다
            </div>
          ) : (
            <ul>
              {results.map((item, idx) => (
                <li key={`${item.restaurantId}-${item.matchedMenuName ?? "r"}-${idx}`}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* 아이콘 */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      {item.matchedMenuName ? (
                        <UtensilsCrossed className="size-5 text-[#2AC1BC]" />
                      ) : (
                        <Store className="size-5 text-[#2AC1BC]" />
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.restaurantName}
                      </p>
                      {item.matchedMenuName && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.matchedMenuName}
                          {item.price != null && (
                            <span className="ml-1 font-medium text-gray-700">
                              {item.price.toLocaleString()}원
                            </span>
                          )}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500">
                          {item.avgRating > 0 ? item.avgRating.toFixed(1) : "-"}
                        </span>
                        <span className="text-xs text-gray-300">
                          ({item.reviewCount})
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
