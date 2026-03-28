"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
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
  PENDING: "대기중",
  RESOLVED: "처리됨",
  REJECTED: "기각",
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <Link href="/admin/reports" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">신고 상세</h1>
      </header>

      <div className="flex-1 px-3 py-3 space-y-3">
        {/* Status + Type Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              report.status === "PENDING"
                ? "bg-orange-100 text-orange-600"
                : report.status === "RESOLVED"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[report.status]}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
            {TARGET_TYPE_LABELS[report.targetType]}
          </span>
        </div>

        {/* Report Content */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">신고 내용</h3>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">사유</span>
              <span className="text-sm font-medium text-gray-900">{report.reason}</span>
            </div>
            {report.description && (
              <div className="px-4 py-2.5">
                <span className="text-sm text-gray-500">상세 설명</span>
                <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {report.description}
                </p>
              </div>
            )}
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">신고일시</span>
              <span className="text-sm text-gray-900">
                {new Date(report.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            {report.adminMemo && (
              <div className="px-4 py-2.5">
                <span className="text-sm text-gray-500">관리자 메모</span>
                <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {report.adminMemo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reporter Info */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">신고자</h3>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">닉네임</span>
              <Link
                href={`/admin/users/${report.reporter.id}`}
                className="text-sm font-medium"
                style={{ color: "#2DB400" }}
              >
                {report.reporter.nickname}
              </Link>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-sm text-gray-500">이메일</span>
              <span className="text-sm text-gray-900">{report.reporter.email}</span>
            </div>
          </div>
        </div>

        {/* Target Info */}
        <div className="rounded-xl bg-white">
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">신고 대상</h3>
          <div className="divide-y divide-gray-100">
            {report.targetType === "USER" && report.targetUser && (
              <>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">유저</span>
                  <Link
                    href={`/admin/users/${report.targetUser.id}`}
                    className="text-sm font-medium"
                    style={{ color: "#2DB400" }}
                  >
                    {report.targetUser.nickname}
                  </Link>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">상태</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      report.targetUser.status === "BANNED"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {report.targetUser.status === "ACTIVE"
                      ? "활성"
                      : report.targetUser.status === "BANNED"
                        ? "정지"
                        : "탈퇴"}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">누적 신고</span>
                  <span className="text-sm text-gray-900">{report.targetUser._count.receivedReports}건</span>
                </div>
              </>
            )}
            {report.targetType === "RESTAURANT" && report.targetRestaurant && (
              <>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">음식점</span>
                  <span className="text-sm font-medium text-gray-900">
                    {report.targetRestaurant.name}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">영업 상태</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      report.targetRestaurant.isOpen
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {report.targetRestaurant.isOpen ? "영업중" : "비공개"}
                  </span>
                </div>
              </>
            )}
            {report.targetType === "MENU" && report.targetMenu && (
              <>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">메뉴</span>
                  <span className="text-sm font-medium text-gray-900">
                    {report.targetMenu.name}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">상태</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      report.targetMenu.isSoldOut
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {report.targetMenu.isSoldOut ? "품절" : "판매중"}
                  </span>
                </div>
              </>
            )}
            {report.targetType === "CHAT" && (
              <div className="px-4 py-2.5">
                <p className="text-sm text-gray-500">채팅 메시지 신고</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isPendingReport && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActionType("reject")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              기각
            </Button>

            {(report.targetType === "USER" || report.targetType === "CHAT") &&
              report.targetUserId && (
                <Button
                  variant="destructive"
                  className="flex-1"
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
                  className="flex-1"
                  onClick={() => setActionType("hideRestaurant")}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  음식점 숨김
                </Button>
              )}

            {report.targetType === "MENU" && report.targetMenuId && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setActionType("hideMenu")}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                메뉴 숨김
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Dialog */}
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
    </div>
  );
}
