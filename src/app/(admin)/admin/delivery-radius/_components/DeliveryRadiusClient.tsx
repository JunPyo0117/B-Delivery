"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import type { DeliveryPolicy, District } from "@/types/delivery-policy";
import { INITIAL_POLICIES, INITIAL_DISTRICTS } from "../_data/mock";

export function DeliveryRadiusClient() {
  const [policies] = useState<DeliveryPolicy[]>(INITIAL_POLICIES);
  const [districts] = useState<District[]>(INITIAL_DISTRICTS);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <Link href="/admin/dashboard" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">배달 반경 관리</h1>
      </header>

      <div className="flex-1 px-3 py-3 space-y-3">
        {/* Tier Policy Section */}
        <div className="rounded-xl bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">티어 정책 설정</h2>

          <div className="mt-3 space-y-2">
            {/* Urban - Blue */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#E3F2FD" }}
            >
              <p className="text-sm font-bold" style={{ color: "#1565C0" }}>
                도심
              </p>
              <p className="text-2xl font-bold" style={{ color: "#1565C0" }}>
                3km
              </p>
            </div>

            {/* Suburban - Orange */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#FFF3E0" }}
            >
              <p className="text-sm font-bold" style={{ color: "#E65100" }}>
                교외
              </p>
              <p className="text-2xl font-bold" style={{ color: "#E65100" }}>
                5km
              </p>
            </div>

            {/* Rural - Green */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <p className="text-sm font-bold" style={{ color: "#2E7D32" }}>
                농어촌
              </p>
              <p className="text-2xl font-bold" style={{ color: "#2E7D32" }}>
                10km
              </p>
            </div>
          </div>
        </div>

        {/* Simulator Section */}
        <div className="rounded-xl bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">시뮬레이터</h2>
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl bg-gray-100 py-12">
            <Map className="h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">
              지역 + 정책 조합 시뮬레이션
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
