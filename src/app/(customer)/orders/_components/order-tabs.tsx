"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { getReorderItems } from "../actions";

/** 주문 내역 탭 타입 */
type TabType = "active" | "done";

/** 서버에서 넘겨받는 주문 데이터 타입 */
export interface OrderData {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  restaurant: {
    name: string;
    imageUrl: string | null;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    menu: { name: string };
  }[];
  hasReview: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  PICKED_UP: "배달 중",
  DONE: "배달 완료",
  CANCELLED: "취소됨",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  PICKED_UP: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const ACTIVE_STATUSES = new Set(["PENDING", "COOKING", "PICKED_UP"]);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatPrice(price: number) {
  return price.toLocaleString();
}

export default function OrderTabs({ orders }: { orders: OrderData[] }) {
  const [tab, setTab] = useState<TabType>("active");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { clearCart, addItem } = useCartStore();

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.status));
  const doneOrders = orders.filter((o) => !ACTIVE_STATUSES.has(o.status));

  const currentOrders = tab === "active" ? activeOrders : doneOrders;

  const handleReorder = async (orderId: string) => {
    startTransition(async () => {
      try {
        const { items, unavailable } = await getReorderItems(orderId);

        if (items.length === 0) {
          alert("주문 가능한 메뉴가 없습니다.");
          return;
        }

        clearCart();
        for (const item of items) {
          addItem(
            {
              menuId: item.menuId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              restaurantId: item.restaurantId,
              restaurantName: item.restaurantName,
            },
            item.quantity
          );
        }

        if (unavailable.length > 0) {
          alert(
            `품절된 메뉴가 제외되었습니다: ${unavailable.join(", ")}`
          );
        }

        router.push("/cart");
      } catch {
        alert("재주문에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <div className="flex flex-col">
      {/* 탭 바 */}
      <div className="sticky top-12 z-30 bg-background border-b">
        <div className="flex">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
              tab === "active"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            배달 중
            {activeOrders.length > 0 && (
              <span className="ml-1 text-xs text-primary">
                {activeOrders.length}
              </span>
            )}
            {tab === "active" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setTab("done")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
              tab === "done"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            완료
            {tab === "done" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* 주문 목록 */}
      {currentOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-base font-medium">
            {tab === "active"
              ? "진행 중인 주문이 없어요"
              : "완료된 주문이 없어요"}
          </p>
          <Link
            href="/"
            className="mt-3 text-sm text-primary font-semibold hover:underline"
          >
            맛있는 음식 주문하러 가기
          </Link>
        </div>
      ) : (
        <div className="divide-y">
          {/* 날짜 그룹별로 렌더링 */}
          {currentOrders.map((order) => {
            const dateStr = formatDate(order.createdAt);
            const itemSummary =
              order.items.length === 1
                ? `${order.items[0].menu.name} ${order.items[0].quantity}개`
                : `${order.items[0].menu.name} 외 ${order.items.length - 1}개`;

            const isDone = order.status === "DONE";
            const isCancelled = order.status === "CANCELLED";

            return (
              <div key={order.id} className="bg-background">
                {/* 날짜 헤더 */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    주문상세 &gt;
                  </Link>
                </div>

                {/* 주문 카드 */}
                <div className="px-4 pb-4">
                  <div className="flex items-start gap-3">
                    {/* 음식점 이미지 */}
                    <div className="relative size-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.restaurant.imageUrl ? (
                        <Image
                          src={order.restaurant.imageUrl}
                          alt={order.restaurant.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </div>

                    {/* 주문 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          {order.restaurant.name}
                        </p>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            STATUS_STYLE[order.status] ?? ""
                          }`}
                        >
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {itemSummary}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        {formatPrice(order.totalPrice)}원
                      </p>
                    </div>
                  </div>

                  {/* 완료 주문 액션 버튼 */}
                  {(isDone || isCancelled) && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={isPending}
                        className="flex-1 h-9 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        같은 메뉴 담기
                      </button>
                      {isDone && !order.hasReview && (
                        <Link
                          href={`/orders/${order.id}/review`}
                          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          리뷰 작성
                        </Link>
                      )}
                      {isDone && order.hasReview && (
                        <span className="flex-1 h-9 rounded-lg bg-muted text-muted-foreground text-sm font-medium flex items-center justify-center">
                          리뷰 작성 완료
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
