"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { OrderStatus } from "@/generated/prisma/enums";
import { updateOrderStatus } from "../../orders/_actions/update-order-status";
import { getDashboardOrders } from "../_actions/dashboard-actions";
import type { DashboardOrder } from "../_actions/dashboard-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { Clock, User, Truck, RefreshCw } from "lucide-react";

// ── 칸반 컬럼 정의 ─────────────────────────────────────────

interface KanbanColumn {
  key: string;
  label: string;
  statuses: OrderStatus[];
  color: string;
  bgColor: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    key: "pending",
    label: "대기",
    statuses: ["PENDING" as OrderStatus],
    color: "#E65100",
    bgColor: "#FFF3E0",
  },
  {
    key: "cooking",
    label: "조리중",
    statuses: ["COOKING" as OrderStatus],
    color: "#1565C0",
    bgColor: "#E3F2FD",
  },
  {
    key: "waiting_rider",
    label: "배달대기",
    statuses: ["WAITING_RIDER" as OrderStatus],
    color: "#6A1B9A",
    bgColor: "#F3E5F5",
  },
  {
    key: "delivering",
    label: "배달중",
    statuses: ["RIDER_ASSIGNED" as OrderStatus, "PICKED_UP" as OrderStatus],
    color: "#2E7D32",
    bgColor: "#E8F5E9",
  },
];

// ── 경과 시간 포맷 ─────────────────────────────────────────

function formatElapsedTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}

function getElapsedMinutes(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// ── 메뉴 요약 텍스트 ───────────────────────────────────────

function getMenuSummary(items: DashboardOrder["items"]): string {
  if (items.length === 0) return "";
  const first = items[0].menuName;
  if (items.length === 1) return first;
  return `${first} 외 ${items.length - 1}`;
}

// ── 칸반 보드 컴포넌트 ─────────────────────────────────────

interface KanbanBoardProps {
  initialOrders: DashboardOrder[];
  restaurantId: string;
}

export function KanbanBoard({ initialOrders, restaurantId }: KanbanBoardProps) {
  const [orders, setOrders] = useState<DashboardOrder[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // 30초마다 폴링 갱신
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const refreshOrders = useCallback(() => {
    startTransition(async () => {
      const updated = await getDashboardOrders(restaurantId);
      setOrders(updated);
    });
  }, [restaurantId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await getDashboardOrders(restaurantId);
      setOrders(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  // 1분마다 경과 시간 갱신을 위한 forceUpdate
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ── 주문 상태 변경 핸들러 ──────────────────────────────

  async function handleStatusChange(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus, reason);
      if (!result.success) {
        setActionError(result.error ?? "상태 변경에 실패했습니다.");
      } else {
        // 즉시 리프레시
        const updated = await getDashboardOrders(restaurantId);
        setOrders(updated);
      }
    });
  }

  function handleAccept(orderId: string) {
    handleStatusChange(orderId, OrderStatus.COOKING);
  }

  function handleRequestDelivery(orderId: string) {
    handleStatusChange(orderId, OrderStatus.WAITING_RIDER);
  }

  function openCancelDialog(orderId: string) {
    setCancelTargetId(orderId);
    setCancelReason("");
    setCancelDialogOpen(true);
  }

  function handleCancelConfirm() {
    if (!cancelTargetId) return;
    if (!cancelReason.trim()) {
      setActionError("취소 사유를 입력해주세요.");
      return;
    }
    handleStatusChange(
      cancelTargetId,
      OrderStatus.CANCELLED,
      cancelReason.trim()
    );
    setCancelDialogOpen(false);
    setCancelTargetId(null);
    setCancelReason("");
  }

  // ── 컬럼별 주문 분류 ──────────────────────────────────

  function getColumnOrders(column: KanbanColumn): DashboardOrder[] {
    return orders.filter((o) =>
      column.statuses.includes(o.status as OrderStatus)
    );
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">주문 현황</h2>
        <button
          onClick={refreshOrders}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", isPending && "animate-spin")}
          />
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {actionError && (
        <div
          className="rounded-lg p-3 text-sm font-medium"
          style={{ backgroundColor: "#FFEBEE", color: "#FF5252" }}
        >
          {actionError}
        </div>
      )}

      {/* 칸반 4컬럼 */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnOrders = getColumnOrders(column);
          return (
            <div key={column.key} className="min-h-[200px]">
              {/* 컬럼 헤더 */}
              <div
                className="flex items-center justify-between rounded-t-lg px-3 py-2"
                style={{ backgroundColor: column.bgColor }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: column.color }}
                >
                  {column.label}
                </span>
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                  style={{ backgroundColor: column.color }}
                >
                  {columnOrders.length}
                </span>
              </div>

              {/* 주문 카드 목록 */}
              <div className="space-y-2 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50/50 p-2 min-h-[160px]">
                {columnOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-[140px] text-xs text-gray-400">
                    주문 없음
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <KanbanCard
                      key={order.id}
                      order={order}
                      columnKey={column.key}
                      onAccept={handleAccept}
                      onReject={openCancelDialog}
                      onRequestDelivery={handleRequestDelivery}
                      isPending={isPending}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 거절 사유 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 거절</DialogTitle>
            <DialogDescription>
              거절 사유를 입력해주세요. 고객에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="예: 재료 소진으로 인해 주문을 받을 수 없습니다."
            className="mt-2"
            rows={3}
          />
          <DialogFooter className="mt-4">
            <button
              onClick={() => setCancelDialogOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={isPending || !cancelReason.trim()}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#FF5252" }}
            >
              {isPending ? "처리중..." : "거절 확인"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 개별 칸반 카드 ─────────────────────────────────────────

interface KanbanCardProps {
  order: DashboardOrder;
  columnKey: string;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onRequestDelivery: (orderId: string) => void;
  isPending: boolean;
}

function KanbanCard({
  order,
  columnKey,
  onAccept,
  onReject,
  onRequestDelivery,
  isPending,
}: KanbanCardProps) {
  const elapsedMin = getElapsedMinutes(order.createdAt);
  const isUrgent = order.status === "PENDING" && elapsedMin >= 3;

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        isUrgent && "border-red-300 bg-red-50"
      )}
    >
      {/* 주문번호 + 경과시간 */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-900">
          #{order.id.slice(-4).toUpperCase()}
        </span>
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs",
            isUrgent ? "font-bold text-red-600" : "text-gray-400"
          )}
        >
          <Clock className="h-3 w-3" />
          {formatElapsedTime(order.createdAt)}
        </span>
      </div>

      {/* 메뉴 요약 */}
      <p className="text-sm text-gray-700 font-medium truncate mb-1">
        {getMenuSummary(order.items)}
      </p>

      {/* 고객 + 가격 */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <User className="h-3 w-3" />
          {order.customerNickname}
        </span>
        <span className="text-sm font-bold text-gray-900">
          {formatPrice(order.totalPrice)}
        </span>
      </div>

      {/* 배달중 컬럼: 기사 정보 */}
      {columnKey === "delivering" && order.delivery && (
        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1 mb-2">
          <Truck className="h-3 w-3" />
          <span>
            {order.status === "PICKED_UP" ? "배달 중" : "기사 배정됨"}
          </span>
        </div>
      )}

      {/* 액션 버튼 */}
      {columnKey === "pending" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onReject(order.id)}
            disabled={isPending}
            className="flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ borderColor: "#FF5252", color: "#FF5252" }}
          >
            거절
          </button>
          <button
            onClick={() => onAccept(order.id)}
            disabled={isPending}
            className="flex-1 rounded-md py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#2DB400" }}
          >
            접수
          </button>
        </div>
      )}

      {columnKey === "cooking" && (
        <button
          onClick={() => onRequestDelivery(order.id)}
          disabled={isPending}
          className="w-full rounded-md py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#1565C0" }}
        >
          배달요청
        </button>
      )}
    </div>
  );
}
