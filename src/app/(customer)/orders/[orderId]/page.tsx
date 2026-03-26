import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  CircleX,
  MapPin,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { KakaoMap } from "@/components/kakao-map";

const ORDER_STEPS = [
  { status: "PENDING", label: "주문 접수", icon: Clock },
  { status: "COOKING", label: "조리중", icon: ChefHat },
  { status: "PICKED_UP", label: "배달 중", icon: Truck },
  { status: "DONE", label: "배달 완료", icon: CheckCircle2 },
] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: { select: { name: true, deliveryFee: true, imageUrl: true, latitude: true, longitude: true } },
      items: {
        include: { menu: { select: { name: true, imageUrl: true } } },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const isCancelled = order.status === "CANCELLED";
  const isDone = order.status === "DONE";
  const currentStepIndex = ORDER_STEPS.findIndex(
    (s) => s.status === order.status
  );

  const menuTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = order.totalPrice - menuTotal;

  const dateStr = new Date(order.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center h-12 px-4">
          <Link href="/orders" className="mr-3 p-1" aria-label="뒤로가기">
            <ArrowLeft className="size-5 text-gray-900" />
          </Link>
          <h1 className="text-[16px] font-bold text-gray-900">주문상세</h1>
        </div>
      </header>

      <div className="flex-1 pb-6">
        {/* 주문 상태 프로그레스 - 클릭 시 상태 페이지로 이동 */}
        <Link
          href={`/orders/${orderId}/status`}
          className="block bg-white px-4 py-6 hover:bg-gray-50/50 transition-colors"
        >
          {isCancelled ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <CircleX className="size-12 text-gray-300" />
              <p className="text-[16px] font-bold text-gray-500">주문이 취소되었습니다</p>
            </div>
          ) : (
            <>
              <p className="text-center text-[17px] font-bold text-gray-900 mb-6">
                {ORDER_STEPS[currentStepIndex]?.label ?? order.status}
              </p>

              {/* 단계 아이콘 */}
              <div className="flex items-center justify-between px-4">
                {ORDER_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center gap-1.5 flex-1"
                    >
                      <div
                        className={`size-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "text-white"
                            : "bg-gray-100 text-gray-400"
                        } ${isCurrent ? "ring-2 ring-offset-2 scale-110" : ""}`}
                        style={isCompleted ? { backgroundColor: "#2DB400", ...(isCurrent ? { ringColor: "#2DB400" } : {}) } : {}}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span
                        className={`text-[10px] ${
                          isCompleted
                            ? "font-semibold"
                            : "text-gray-400"
                        }`}
                        style={isCompleted ? { color: "#2DB400" } : {}}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 프로그레스 바 */}
              <div className="mx-10 mt-3 flex gap-1">
                {ORDER_STEPS.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-1 rounded-full"
                    style={{ backgroundColor: idx < currentStepIndex ? "#2DB400" : "#e5e7eb" }}
                  />
                ))}
              </div>

              {/* 실시간 상태 보기 안내 */}
              {!isDone && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <span className="text-[12px] font-semibold" style={{ color: "#2DB400" }}>
                    실시간 주문 상태 보기
                  </span>
                  <ChevronRight className="size-3.5" style={{ color: "#2DB400" }} />
                </div>
              )}
            </>
          )}
        </Link>

        {/* 가게 정보 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-gray-900">{order.restaurant.name}</h3>
          </div>
          <p className="text-[12px] text-gray-400 mt-1">{dateStr}</p>
        </div>

        {/* 주문 메뉴 */}
        <div className="bg-white mt-2 px-4 py-4">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">주문 메뉴</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[13px] text-gray-700">{item.menu.name}</span>
                  <span className="text-[13px] text-gray-400">{item.quantity}개</span>
                </div>
                <span className="text-[13px] font-semibold text-gray-900">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white mt-2 px-4 py-4">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">결제정보</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">주문금액</span>
              <span className="text-gray-700">{menuTotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">배달비</span>
              <span className="text-gray-700">
                {deliveryFee === 0
                  ? "무료"
                  : `${deliveryFee.toLocaleString()}원`}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="text-[14px] font-bold text-gray-900">총 결제금액</span>
              <span className="text-[15px] font-extrabold" style={{ color: "#2DB400" }}>
                {order.totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 배달 주소 + 지도 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="size-4 text-gray-400" />
            <h3 className="text-[14px] font-bold text-gray-900">배달 주소</h3>
          </div>
          <p className="text-[13px] text-gray-500 pl-6 mb-3">
            {order.deliveryAddress}
          </p>

          {/* 가게 위치 지도 */}
          {order.restaurant.latitude && order.restaurant.longitude && (
            <div className="mt-2">
              <p className="text-[12px] text-gray-400 mb-2">가게 위치</p>
              <KakaoMap
                lat={order.restaurant.latitude}
                lng={order.restaurant.longitude}
                level={3}
                markers={[
                  { lat: order.restaurant.latitude, lng: order.restaurant.longitude, label: order.restaurant.name },
                ]}
                className="h-44 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
