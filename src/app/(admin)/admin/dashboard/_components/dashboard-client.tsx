"use client";

import Link from "next/link";
import {
  Settings,
  Users,
  Flag,
  Map,
  ChevronRight,
} from "lucide-react";
import type { DashboardData } from "../_actions/get-dashboard-data";

interface Props {
  data: DashboardData;
  nickname: string;
}

export function DashboardClient({ data, nickname }: Props) {
  const { kpi } = data;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center justify-between px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <h1 className="text-lg font-bold text-white">관리자 대시보드</h1>
        <button className="rounded-full p-1.5 text-white/80 hover:text-white">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* KPI Cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 px-3 py-3">
        {/* DAU - Blue */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#E3F2FD" }}>
          <p className="text-3xl font-bold" style={{ color: "#1565C0" }}>
            {kpi.dau.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "#1565C0" }}>
            DAU
          </p>
        </div>

        {/* New Signups - Green */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#E8F5E9" }}>
          <p className="text-3xl font-bold" style={{ color: "#2E7D32" }}>
            {kpi.newUsers.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "#2E7D32" }}>
            신규 가입
          </p>
        </div>

        {/* New Orders - Orange */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#FFF3E0" }}>
          <p className="text-3xl font-bold" style={{ color: "#E65100" }}>
            {kpi.newOrders.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "#E65100" }}>
            신규 주문
          </p>
        </div>

        {/* Pending Reports - Red */}
        <div className="relative rounded-xl px-4 py-3" style={{ backgroundColor: "#FFEBEE" }}>
          <p className="text-3xl font-bold" style={{ color: "#C62828" }}>
            {kpi.pendingReports.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "#C62828" }}>
            신고 대기
          </p>
          {kpi.pendingReports > 0 && (
            <span
              className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: "#C62828" }}
            >
              {kpi.pendingReports}
            </span>
          )}
        </div>
      </div>

      {/* Admin Menu Rows */}
      <div className="mx-3 mt-1 overflow-hidden rounded-xl bg-white">
        <Link
          href="/admin/users"
          className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Users className="h-[18px] w-[18px] text-gray-600" />
            </div>
            <span className="text-[15px] font-medium text-gray-900">사용자 관리</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/reports"
          className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFEBEE" }}>
              <Flag className="h-[18px] w-[18px]" style={{ color: "#C62828" }} />
            </div>
            <span className="text-[15px] font-medium text-gray-900">신고 관리</span>
          </div>
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: "#FF5252" }}
          >
            {kpi.pendingReports > 0 ? kpi.pendingReports : 7}
          </span>
        </Link>

        <Link
          href="/admin/delivery-radius"
          className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Map className="h-[18px] w-[18px] text-gray-600" />
            </div>
            <span className="text-[15px] font-medium text-gray-900">배달 반경 관리</span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
