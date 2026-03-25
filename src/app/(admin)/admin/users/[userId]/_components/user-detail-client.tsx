"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  ACTIVE: "활성",
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  BANNED: "destructive",
  WITHDRAWN: "secondary",
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
    <main className="mx-auto max-w-4xl p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          유저 목록으로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user.nickname}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
            <Badge variant={STATUS_VARIANT[user.status]}>
              {STATUS_LABELS[user.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 유저 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">가입일</span>
              <span>
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">기본 주소</span>
              <span className="max-w-[200px] truncate text-right">
                {user.defaultAddress || "-"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 수</span>
              <span>{user._count.orders}건</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">리뷰 수</span>
              <span>{user._count.reviews}건</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">피신고 수</span>
              <span>{user._count.receivedReports}건</span>
            </div>
            {user.restaurant && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">운영 음식점</span>
                  <span>{user.restaurant.name}</span>
                </div>
              </>
            )}
            {user.bannedAt && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">정지일</span>
                  <span className="text-destructive">
                    {new Date(user.bannedAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 관리 액션 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.status === "ACTIVE" ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDialogType("ban")}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                회원 정지
              </Button>
            ) : user.status === "BANNED" ? (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setDialogType("unban")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                정지 해제
              </Button>
            ) : null}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedRole(user.role);
                setDialogType("role");
              }}
            >
              <UserX className="mr-2 h-4 w-4" />
              역할 변경
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 주문 이력 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">
            최근 주문 ({user._count.orders}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              주문 내역이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {user.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {order.restaurant.name}
                    </span>
                    <Badge variant="outline">
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {order.items
                      .map((item) => `${item.menu.name} x${item.quantity}`)
                      .join(", ")}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="font-medium text-foreground">
                      {order.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 피신고 이력 */}
      {user.receivedReports.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              피신고 이력 ({user._count.receivedReports}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.receivedReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span>{report.reason}</span>
                    <Badge
                      variant={
                        report.status === "PENDING"
                          ? "outline"
                          : report.status === "REJECTED"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {report.status === "PENDING"
                        ? "대기"
                        : report.status === "REJECTED"
                          ? "기각"
                          : "처리됨"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>신고자: {report.reporter.nickname}</span>
                    <span>
                      {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정지/해제 다이얼로그 */}
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

      {/* 역할 변경 다이얼로그 */}
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
    </main>
  );
}
