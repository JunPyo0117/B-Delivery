"use client";

import { useState, useMemo } from "react";
import { ReviewCard } from "./review-card";
import type { OwnerReviewItem } from "../_actions/review-actions";

type FilterTab = "all" | "unreplied" | "replied";
type SortKey = "latest" | "rating-high" | "rating-low";

interface ReviewListProps {
  reviews: OwnerReviewItem[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("latest");

  const filteredAndSorted = useMemo(() => {
    // 1) 필터
    let filtered = reviews;
    if (activeTab === "unreplied") {
      filtered = reviews.filter((r) => !r.ownerReply);
    } else if (activeTab === "replied") {
      filtered = reviews.filter((r) => !!r.ownerReply);
    }

    // 2) 정렬
    const sorted = [...filtered];
    switch (sortKey) {
      case "latest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "rating-high":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-low":
        sorted.sort((a, b) => a.rating - b.rating);
        break;
    }

    return sorted;
  }, [reviews, activeTab, sortKey]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "전체", count: reviews.length },
    {
      key: "unreplied",
      label: "미답변",
      count: reviews.filter((r) => !r.ownerReply).length,
    },
    {
      key: "replied",
      label: "답변완료",
      count: reviews.filter((r) => !!r.ownerReply).length,
    },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "latest", label: "최신순" },
    { key: "rating-high", label: "별점 높은순" },
    { key: "rating-low", label: "별점 낮은순" },
  ];

  return (
    <div>
      {/* 필터 탭 + 정렬 */}
      <div className="flex items-center justify-between">
        {/* 탭 필터 */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#2DB400] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1 ${
                  activeTab === tab.key ? "text-white/80" : "text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 정렬 셀렉트 */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none focus:border-[#2DB400] focus:ring-1 focus:ring-[#2DB400]/30"
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 리뷰 카드 리스트 */}
      <div className="mt-4 space-y-4">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-gray-400">
              {activeTab === "unreplied"
                ? "미답변 리뷰가 없습니다."
                : activeTab === "replied"
                  ? "답변 완료된 리뷰가 없습니다."
                  : "아직 리뷰가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
