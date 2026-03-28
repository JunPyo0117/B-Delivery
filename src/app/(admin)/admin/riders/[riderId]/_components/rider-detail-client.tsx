"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { updateRiderStatus } from "../../actions";
import type { UserStatus, DeliveryStatus, TransportType } from "@/generated/prisma/client";
import { ArrowLeft, ShieldAlert, ShieldCheck, Truck, Clock, Wallet } from "lucide-react";

const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "도보",
  BICYCLE: "자전거",
  MOTORCYCLE: "오토바이",
  CAR: "자동차",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활동중",
  BANNED: "정지",
  WITHDRAWN: "탈퇴",
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "배달 요청",
  ACCEPTED: "수락",
  AT_STORE: "가게 도착",
  PICKED_UP: "픽업 완료",
  DELIVERING: "배달 중",
  DONE: "완료",
  CANCELLED: "취소",
};

interface RiderDetailData {
  id: string;
  nickname: string;
  email: string;
  image: string | null;
  status: UserStatus;
  bannedAt: string | null;
  createdAt: string;
  riderProfile: {
    transportType: TransportType;
    activityArea: string | null;
    totalDeliveries: number;
    totalEarnings: number;
  };
  riderLocation: {
    isOnline: boolean;
  } | null;
  deliveries: {
    id: string;
    status: DeliveryStatus;
    riderFee: number;
    createdAt: string;
    completedAt: string | null;
    order: {
      id: string;
      deliveryAddress: string;
      totalPrice: number;
      restaurant: { name: string };
      user: { nickname: string };
    };
  }[];
  receivedReports: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { nickname: string };
  }[];
  avgDeliveryTime: number | null;
  _count: {
    deliveries: number;
    receivedReports: number;
  };
}

interface Props {
  rider: RiderDetailData;
}

export function RiderDetailClient({ rider }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogType, setDialogType] = useState<
    "ban" | "unban" | null
  >(null);

  async function handleStatusChange(newStatus: UserStatus) {
    startTransition(async () => {
      const result = await updateRiderStatus(rider.id, newStatus);
      if (result.success) {
        setDialogType(null);
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <Link href="/admin/riders" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">기사 상세</h1>
      </header>

      <div className="flex-1 px-3 py-3 space-y-3">
        {/* Rider Profile Card */}
        <div className="rounded-xl bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
              {rider.image ? (
                <img src={rider.image} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="text-base font-bold text-gray-500">
                  {rider.nickname?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  rider.riderLocation?.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-900">{rider.nickname}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    rider.status === "BANNED"
                      ? "bg-red-100 text-red-600"
                      : rider.status === "WITHDRAWN"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                  }`}
                >
                  {STATUS_LABELS[rider.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {TRANSPORT_LABELS[rider.riderProfile.transportType]} · {rider.riderProfile.activityArea || "미설정"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-3 text-center">
            <Truck className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 text-lg font-bold text-gray-900">
              {rider.riderProfile.totalDeliveries}
            </p>
            <p className="text-[11px] text-gray-500">총 배달</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center">
            <Wallet className="mx-auto h-5 w-5 text-green-500" />
            <p className="mt-1 text-lg font-bold text-gray-900">
              {rider.riderProfile.totalEarnings.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500">총 수익(원)</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center">
            <Clock className="mx-auto h-5 w-5 text-orange-500" />
            <p className="mt-1 text-lg font-bold text-gray-900">
              {rider.avgDeliveryTime !== null ? `${rider.avgDeliveryTime}분` : "-"}
            </p>
            <p className="text-[11px] text-gray-500">평균 시간</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">기본 정보</h3>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">이동수단</span>
              <span className="text-sm font-medium text-gray-900">
                {TRANSPORT_LABELS[rider.riderProfile.transportType]}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">활동지역</span>
              <span className="text-sm text-gray-900">
                {rider.riderProfile.activityArea || "-"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">온라인 상태</span>
              <span className={`text-sm font-medium ${
                rider.riderLocation?.isOnline ? "text-green-600" : "text-gray-500"
              }`}>
                {rider.riderLocation?.isOnline ? "온라인" : "오프라인"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">가입일</span>
              <span className="text-sm text-gray-900">
                {new Date(rider.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">피신고 수</span>
              <span className="text-sm text-gray-900">{rider._count.receivedReports}건</span>
            </div>
            {rider.bannedAt && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">정지일</span>
                <span className="text-sm text-red-500">
                  {new Date(rider.bannedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {rider.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setDialogType("ban")}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              기사 정지
            </Button>
          ) : rider.status === "BANNED" ? (
            <Button
              className="flex-1"
              onClick={() => setDialogType("unban")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              정지 해제
            </Button>
          ) : null}
        </div>

        {/* Recent Deliveries */}
        {rider.deliveries.length > 0 && (
          <div className="rounded-xl bg-white">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">
              최근 배달 ({rider._count.deliveries}건)
            </h3>
            <div className="divide-y divide-gray-100 px-4 pb-4">
              {rider.deliveries.map((delivery) => (
                <div key={delivery.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {delivery.order.restaurant.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        delivery.status === "DONE"
                          ? "bg-green-100 text-green-600"
                          : delivery.status === "CANCELLED"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {DELIVERY_STATUS_LABELS[delivery.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    → {delivery.order.user.nickname} ({delivery.order.deliveryAddress})
                  </p>
                  <div className="mt-0.5 flex justify-between text-xs text-gray-400">
                    <span>
                      {new Date(delivery.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="font-medium text-gray-700">
                      수수료 {delivery.riderFee.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Received Reports */}
        {rider.receivedReports.length > 0 && (
          <div className="rounded-xl bg-white">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">
              피신고 이력 ({rider._count.receivedReports}건)
            </h3>
            <div className="divide-y divide-gray-100 px-4 pb-4">
              {rider.receivedReports.map((report) => (
                <div key={report.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{report.reason}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        report.status === "PENDING"
                          ? "bg-orange-100 text-orange-600"
                          : report.status === "REJECTED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {report.status === "PENDING"
                        ? "대기"
                        : report.status === "REJECTED"
                          ? "기각"
                          : "처리됨"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-xs text-gray-400">
                    <span>신고자: {report.reporter.nickname}</span>
                    <span>
                      {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog
        open={dialogType === "ban"}
        onOpenChange={(open) => !open && setDialogType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 정지</DialogTitle>
            <DialogDescription>
              {rider.nickname}님을 정지하시겠습니까? 정지된 기사는 배달을
              수행할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogType(null)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("BANNED")}
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "정지"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogType === "unban"}
        onOpenChange={(open) => !open && setDialogType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정지 해제</DialogTitle>
            <DialogDescription>
              {rider.nickname}님의 정지를 해제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogType(null)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "해제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
