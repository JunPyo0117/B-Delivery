"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchRestaurants,
  type SearchResultItem,
} from "../api/searchRestaurants";

interface UseSearchParams {
  lat: number;
  lng: number;
  radius?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  results: SearchResultItem[];
  isLoading: boolean;
  clearSearch: () => void;
}

export function useSearch({ lat, lng, radius }: UseSearchParams): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0); // 순서 보장용 카운터

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsLoading(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 이전 타이머 취소
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 300ms 디바운스
    timerRef.current = setTimeout(async () => {
      const requestId = ++abortRef.current;

      try {
        const data = await searchRestaurants({
          query: trimmed,
          lat,
          lng,
          radius,
        });

        // 이후 요청이 이미 시작됐으면 결과 무시 (stale response 방지)
        if (requestId === abortRef.current) {
          setResults(data);
          setIsLoading(false);
        }
      } catch {
        if (requestId === abortRef.current) {
          setResults([]);
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, lat, lng, radius]);

  return { query, setQuery, results, isLoading, clearSearch };
}
