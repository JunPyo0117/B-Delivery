"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateUserStatus, updateUserRole } from "../../actions";
import type { Role, UserStatus, OrderStatus } from "@/generated/prisma/client";
import { ArrowLeft, ShieldAlert, ShieldCheck, UserX } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  USER: "일반 유저",
  OWNER: "사장님",
  ADMIN: "관리자",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활동중",
  BANNED: "정지",
  WITHDRAWN: "탈퇴",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  PICKED_UP: "배달 중",
  DONE: "완료",
  CANCELLED: "취소",
};

interface UserDetailData {
  id: string;
  nickname: string;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
  bannedAt: string | null;
  createdAt: string;
  defaultAddress: string | null;
  restaurant: { id: string; name: string } | null;
  orders: {
    id: string;
    status: OrderStatus;
    totalPrice: number;
    createdAt: string;
    restaurant: { id: string; name: string };
    items: { menu: { name: string }; quantity: number; price: number }[];
  }[];
  receivedReports: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { nickname: string };
  }[];
  _count: {
    orders: number;
    reviews: number;
    sentReports: number;
    receivedReports: number;
  };
}

interface Props {
  user: UserDetailData;
}

export function UserDetailClient({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogType, setDialogType] = useState<
    "ban" | "unban" | "role" | null
  >(null);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);

  async function handleStatusChange(newStatus: UserStatus) {
    startTransition(async () => {
      const result = await updateUserStatus(user.id, newStatus);
      if (result.success) {
        setDialogType(null);
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  async function handleRoleChange() {
    startTransition(async () => {
      const result = await updateUserRole(user.id, selectedRole);
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
        <Link href="/admin/users" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">사용자 상세</h1>
      </header>

      <div className="flex-1 px-3 py-3 space-y-3">
        {/* User Profile Card */}
        <div className="rounded-xl bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
              {user.image ? (
                <img src={user.image} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="text-base font-bold text-gray-500">
                  {user.nickname?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-900">{user.nickname}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    user.status === "BANNED"
                      ? "bg-red-100 text-red-600"
                      : user.status === "WITHDRAWN"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                  }`}
                >
                  {STATUS_LABELS[user.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">기본 정보</h3>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">역할</span>
              <span className="text-sm font-medium text-gray-900">{ROLE_LABELS[user.role]}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">가입일</span>
              <span className="text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">기본 주소</span>
              <span className="max-w-[180px] truncate text-right text-sm text-gray-900">
                {user.defaultAddress || "-"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">주문 수</span>
              <span className="text-sm text-gray-900">{user._count.orders}건</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">리뷰 수</span>
              <span className="text-sm text-gray-900">{user._count.reviews}건</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">피신고 수</span>
              <span className="text-sm text-gray-900">{user._count.receivedReports}건</span>
            </div>
            {user.restaurant && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">운영 음식점</span>
                <span className="text-sm text-gray-900">{user.restaurant.name}</span>
              </div>
            )}
            {user.bannedAt && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">정지일</span>
                <span className="text-sm text-red-500">
                  {new Date(user.bannedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {user.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setDialogType("ban")}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              회원 정지
            </Button>
          ) : user.status === "BANNED" ? (
            <Button
              className="flex-1"
              onClick={() => setDialogType("unban")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              정지 해제
            </Button>
          ) : null}

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSelectedRole(user.role);
              setDialogType("role");
            }}
          >
            <UserX className="mr-2 h-4 w-4" />
            역할 변경
          </Button>
        </div>

        {/* Recent Orders */}
        {user.orders.length > 0 && (
          <div className="rounded-xl bg-white">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">
              최근 주문 ({user._count.orders}건)
            </h3>
            <div className="divide-y divide-gray-100 px-4 pb-4">
              {user.orders.map((order) => (
                <div key={order.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {order.restaurant.name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    {order.items
                      .map((item) => `${item.menu.name} x${item.quantity}`)
                      .join(", ")}
                  </p>
                  <div className="mt-0.5 flex justify-between text-xs text-gray-400">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="font-medium text-gray-700">
                      {order.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Received Reports */}
        {user.receivedReports.length > 0 && (
          <div className="rounded-xl bg-white">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">
              피신고 이력 ({user._count.receivedReports}건)
            </h3>
            <div className="divide-y divide-gray-100 px-4 pb-4">
              {user.receivedReports.map((report) => (
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
            <DialogTitle>회원 정지</DialogTitle>
            <DialogDescription>
              {user.nickname}님을 정지하시겠습니까? 정지된 회원은 서비스를
              이용할 수 없습니다.
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
              {user.nickname}님의 정지를 해제하시겠습니까?
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

      <Dialog
        open={dialogType === "role"}
        onOpenChange={(open) => !open && setDialogType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              {user.nickname}님의 역할을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
            >
              <option value="USER">일반 유저</option>
              <option value="OWNER">사장님</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogType(null)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleRoleChange} disabled={isPending}>
              {isPending ? "처리 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
