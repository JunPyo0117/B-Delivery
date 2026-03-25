"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  rejectReport,
  resolveReportWithBan,
  resolveReportWithHideRestaurant,
  resolveReportWithHideMenu,
} from "../../actions";
import type { ReportTarget, ReportStatus, UserStatus } from "@/generated/prisma/client";
import { ArrowLeft, Ban, EyeOff, XCircle } from "lucide-react";

const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: "유저",
  RESTAURANT: "음식점",
  MENU: "메뉴",
  CHAT: "채팅",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "대기",
  RESOLVED: "처리됨",
  REJECTED: "기각",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  RESOLVED: "default",
  REJECTED: "secondary",
};

interface ReportDetailData {
  id: string;
  reporterId: string;
  reporter: { id: string; nickname: string; email: string; status: UserStatus };
  targetType: ReportTarget;
  targetUserId: string | null;
  targetUser: {
    id: string;
    nickname: string;
    email: string;
    status: UserStatus;
    _count: { receivedReports: number };
  } | null;
  targetRestaurantId: string | null;
  targetRestaurant: { id: string; name: string; isOpen: boolean } | null;
  targetMenuId: string | null;
  targetMenu: {
    id: string;
    name: string;
    isSoldOut: boolean;
    restaurantId: string;
  } | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  report: ReportDetailData;
}

type ActionType = "reject" | "ban" | "hideRestaurant" | "hideMenu" | null;

export function ReportDetailClient({ report }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<ActionType>(null);
  const [adminMemo, setAdminMemo] = useState("");

  const isPendingReport = report.status === "PENDING";

  async function handleAction() {
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      switch (actionType) {
        case "reject":
          result = await rejectReport(report.id, adminMemo);
          break;
        case "ban":
          if (!report.targetUserId) {
            alert("대상 유저를 찾을 수 없습니다.");
            return;
          }
          result = await resolveReportWithBan(
            report.id,
            report.targetUserId,
            adminMemo
          );
          break;
        case "hideRestaurant":
          if (!report.targetRestaurantId) {
            alert("대상 음식점을 찾을 수 없습니다.");
            return;
          }
          result = await resolveReportWithHideRestaurant(
            report.id,
            report.targetRestaurantId,
            adminMemo
          );
          break;
        case "hideMenu":
          if (!report.targetMenuId) {
            alert("대상 메뉴를 찾을 수 없습니다.");
            return;
          }
          result = await resolveReportWithHideMenu(
            report.id,
            report.targetMenuId,
            adminMemo
          );
          break;
        default:
          return;
      }

      if (result.success) {
        setActionType(null);
        setAdminMemo("");
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  function getActionTitle() {
    switch (actionType) {
      case "reject":
        return "신고 기각";
      case "ban":
        return "회원 정지";
      case "hideRestaurant":
        return "음식점 비공개";
      case "hideMenu":
        return "메뉴 품절 처리";
      default:
        return "";
    }
  }

  function getActionDescription() {
    switch (actionType) {
      case "reject":
        return "이 신고를 기각합니다. 별도 조치를 취하지 않습니다.";
      case "ban":
        return `${report.targetUser?.nickname}님을 정지합니다. 서비스를 이용할 수 없게 됩니다.`;
      case "hideRestaurant":
        return `${report.targetRestaurant?.name} 음식점을 비공개 처리합니다.`;
      case "hideMenu":
        return `${report.targetMenu?.name} 메뉴를 품절 처리합니다.`;
      default:
        return "";
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/admin/reports"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          신고 목록으로
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">신고 상세</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {TARGET_TYPE_LABELS[report.targetType]}
            </Badge>
            <Badge variant={STATUS_VARIANT[report.status]}>
              {STATUS_LABELS[report.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* 신고 내용 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">신고 내용</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">사유</span>
            <span className="font-medium">{report.reason}</span>
          </div>
          {report.description && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">상세 설명</span>
                <p className="mt-1 rounded-lg bg-muted/50 p-3">
                  {report.description}
                </p>
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">신고일시</span>
            <span>
              {new Date(report.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>
          {report.adminMemo && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">관리자 메모</span>
                <p className="mt-1 rounded-lg bg-muted/50 p-3">
                  {report.adminMemo}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* 신고자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">신고자</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">닉네임</span>
              <Link
                href={`/admin/users/${report.reporter.id}`}
                className="text-primary hover:underline"
              >
                {report.reporter.nickname}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span>{report.reporter.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* 대상 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">신고 대상</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {report.targetType === "USER" && report.targetUser && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">유저</span>
                  <Link
                    href={`/admin/users/${report.targetUser.id}`}
                    className="text-primary hover:underline"
                  >
                    {report.targetUser.nickname}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <Badge
                    variant={
                      report.targetUser.status === "BANNED"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {report.targetUser.status === "ACTIVE"
                      ? "활성"
                      : report.targetUser.status === "BANNED"
                        ? "정지"
                        : "탈퇴"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">누적 신고</span>
                  <span>{report.targetUser._count.receivedReports}건</span>
                </div>
              </>
            )}
            {report.targetType === "RESTAURANT" &&
              report.targetRestaurant && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">음식점</span>
                    <span className="font-medium">
                      {report.targetRestaurant.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">영업 상태</span>
                    <Badge
                      variant={
                        report.targetRestaurant.isOpen
                          ? "default"
                          : "secondary"
                      }
                    >
                      {report.targetRestaurant.isOpen ? "영업중" : "비공개"}
                    </Badge>
                  </div>
                </>
              )}
            {report.targetType === "MENU" && report.targetMenu && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">메뉴</span>
                  <span className="font-medium">
                    {report.targetMenu.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <Badge
                    variant={
                      report.targetMenu.isSoldOut ? "secondary" : "default"
                    }
                  >
                    {report.targetMenu.isSoldOut ? "품절" : "판매중"}
                  </Badge>
                </div>
              </>
            )}
            {report.targetType === "CHAT" && (
              <p className="text-muted-foreground">채팅 메시지 신고</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 처리 액션 */}
      {isPendingReport && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">처리</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setActionType("reject")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              기각
            </Button>

            {(report.targetType === "USER" ||
              report.targetType === "CHAT") &&
              report.targetUserId && (
                <Button
                  variant="destructive"
                  onClick={() => setActionType("ban")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  회원 정지
                </Button>
              )}

            {report.targetType === "RESTAURANT" &&
              report.targetRestaurantId && (
                <Button
                  variant="destructive"
                  onClick={() => setActionType("hideRestaurant")}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  음식점 숨김
                </Button>
              )}

            {report.targetType === "MENU" && report.targetMenuId && (
              <Button
                variant="destructive"
                onClick={() => setActionType("hideMenu")}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                메뉴 숨김
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 처리 확인 다이얼로그 */}
      <Dialog
        open={actionType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setAdminMemo("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
            <DialogDescription>{getActionDescription()}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1.5 block text-sm font-medium">
              관리자 메모 (선택)
            </label>
            <Textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              placeholder="처리 사유를 입력하세요"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setAdminMemo("");
              }}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant={actionType === "reject" ? "secondary" : "destructive"}
              onClick={handleAction}
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
