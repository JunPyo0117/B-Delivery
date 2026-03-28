"use client";

import type { AdminChatDetail } from "../actions";
import { formatPrice } from "@/shared/lib/utils";

// ─── Constants ───────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  USER: "고객",
  OWNER: "사장",
  RIDER: "기사",
  ADMIN: "관리자",
};

const ORDER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "주문 접수",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  COOKING: {
    label: "조리중",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  WAITING_RIDER: {
    label: "기사 대기",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  RIDER_ASSIGNED: {
    label: "기사 배정",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  PICKED_UP: {
    label: "배달 중",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  DONE: {
    label: "배달 완료",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "취소",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "배달 요청",
  ACCEPTED: "기사 수락",
  AT_STORE: "가게 도착",
  PICKED_UP: "픽업 완료",
  DELIVERING: "배달 중",
  DONE: "배달 완료",
  CANCELLED: "취소",
};

const CHAT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  WAITING: {
    label: "대기",
    className: "bg-amber-100 text-amber-700",
  },
  IN_PROGRESS: {
    label: "진행중",
    className: "bg-blue-100 text-blue-700",
  },
  CLOSED: {
    label: "완료",
    className: "bg-gray-100 text-gray-500",
  },
};

const CHAT_TYPE_LABELS: Record<string, string> = {
  CUSTOMER_SUPPORT: "고객 상담",
  OWNER_SUPPORT: "사장 상담",
  RIDER_SUPPORT: "기사 상담",
};

// ─── Helpers ─────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Props ───────────────────────────────────────────────

interface InfoPanelProps {
  chatDetail: AdminChatDetail | null;
}

// ─── Component ───────────────────────────────────────────

export function InfoPanel({ chatDetail }: InfoPanelProps) {
  if (!chatDetail) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-gray-400">
        <span className="mb-2 text-3xl">📋</span>
        <p className="text-[13px]">채팅을 선택하면</p>
        <p className="text-[13px]">상담 정보가 표시됩니다.</p>
      </div>
    );
  }

  const { user, order, previousChats } = chatDetail;
  const orderStatus = order
    ? ORDER_STATUS_LABELS[order.status] ?? {
        label: order.status,
        className: "bg-gray-100 text-gray-600 border-gray-200",
      }
    : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* 상대방 정보 */}
      <section className="border-b border-gray-100 px-4 py-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[14px]">👤</span>
          <h3 className="text-[13px] font-bold text-gray-900">상대방 정보</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* 아바타 */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-gray-500">
                  {user.nickname?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                {user.nickname}
              </p>
              <p className="text-[12px] text-gray-500">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-gray-500">이메일</span>
                <span className="font-medium text-gray-700 truncate max-w-[160px]">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">가입일</span>
                <span className="font-medium text-gray-700">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">총 주문</span>
                <span className="font-medium text-gray-700">
                  {user._count.orders}건
                </span>
              </div>
              {user._count.deliveries > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">총 배달</span>
                  <span className="font-medium text-gray-700">
                    {user._count.deliveries}건
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 연결된 주문 정보 */}
      {order && (
        <section className="border-b border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-[14px]">📦</span>
            <h3 className="text-[13px] font-bold text-gray-900">연결된 주문</h3>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="space-y-2">
              {/* 주문번호 + 상태 */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-600">
                  #{order.id.slice(0, 8)}
                </span>
                {orderStatus && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${orderStatus.className}`}
                  >
                    {orderStatus.label}
                  </span>
                )}
              </div>

              {/* 음식점명 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-gray-500">음식점</span>
                <span className="text-[12px] font-medium text-gray-900">
                  {order.restaurant.name}
                </span>
              </div>

              {/* 금액 */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500">주문 금액</span>
                <span className="text-[13px] font-bold text-gray-900">
                  {formatPrice(order.totalPrice + order.deliveryFee)}
                </span>
              </div>

              {/* 배달 주소 */}
              <div>
                <span className="text-[12px] text-gray-500">배달 주소</span>
                <p className="mt-0.5 text-[12px] text-gray-700 leading-relaxed">
                  {order.deliveryAddress}
                </p>
              </div>

              {/* 기사 정보 */}
              {order.delivery && (
                <div className="mt-1 rounded-md bg-gray-50 p-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">배달 기사</span>
                    <span className="font-medium text-gray-700">
                      {order.delivery.rider?.nickname ?? "미배정"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">배달 상태</span>
                    <span className="font-medium text-gray-700">
                      {DELIVERY_STATUS_LABELS[order.delivery.status] ??
                        order.delivery.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 빠른 액션 */}
      <section className="border-b border-gray-100 px-4 py-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[14px]">🔧</span>
          <h3 className="text-[13px] font-bold text-gray-900">빠른 액션</h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {order?.restaurant?.ownerId && (
            <button
              onClick={async () => {
                const res = await fetch("/api/chat/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: order.id, chatType: "OWNER_SUPPORT" }),
                });
                const data = await res.json();
                if (data.chatId) onSelectChat?.(data.chatId);
              }}
              className="flex items-center justify-center rounded-lg border border-[#2DB400] px-3 py-2 text-[12px] font-medium text-[#2DB400] transition-colors hover:bg-[#2DB400]/5"
            >
              사장에게 문의 열기
            </button>
          )}
          {order?.delivery?.riderId && (
            <button
              onClick={async () => {
                const res = await fetch("/api/chat/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: order.id, chatType: "RIDER_SUPPORT" }),
                });
                const data = await res.json();
                if (data.chatId) onSelectChat?.(data.chatId);
              }}
              className="flex items-center justify-center rounded-lg border border-[#2DB400] px-3 py-2 text-[12px] font-medium text-[#2DB400] transition-colors hover:bg-[#2DB400]/5"
            >
              기사에게 문의 열기
            </button>
          )}
          {order && order.status !== "CANCELLED" && order.status !== "DONE" && (
            <button
              onClick={async () => {
                if (!confirm("주문을 강제 취소하시겠습니까?")) return;
                await fetch(`/api/orders/${order.id}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "CANCELLED" }),
                });
                alert("주문이 취소되었습니다.");
              }}
              className="flex items-center justify-center rounded-lg border border-red-400 px-3 py-2 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              주문 강제 취소
            </button>
          )}
          {order && order.status === "DONE" && (
            <button
              onClick={() => alert("환불이 요청되었습니다. (MVP: 상태만 기록)")}
              className="flex items-center justify-center rounded-lg border border-orange-400 px-3 py-2 text-[12px] font-medium text-orange-500 transition-colors hover:bg-orange-50"
            >
              환불 처리
            </button>
          )}
        </div>
      </section>

      {/* 이전 상담 이력 */}
      <section className="px-4 py-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[14px]">📝</span>
          <h3 className="text-[13px] font-bold text-gray-900">
            이전 상담 이력 ({previousChats.length})
          </h3>
        </div>

        {previousChats.length === 0 ? (
          <p className="text-[12px] text-gray-400">이전 상담 이력이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {previousChats.map((chat) => {
              const chatStatus = CHAT_STATUS_LABELS[chat.status] ?? {
                label: chat.status,
                className: "bg-gray-100 text-gray-500",
              };
              return (
                <div
                  key={chat.id}
                  className="rounded-lg border border-gray-100 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-gray-700">
                      {CHAT_TYPE_LABELS[chat.chatType] ?? chat.chatType}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${chatStatus.className}`}
                    >
                      {chatStatus.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {chat.category ?? "-"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatDate(chat.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
