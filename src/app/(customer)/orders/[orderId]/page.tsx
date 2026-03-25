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
} from "lucide-react";
import Link from "next/link";

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
      restaurant: { select: { name: true, deliveryFee: true } },
      items: {
        include: { menu: { select: { name: true, imageUrl: true } } },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const isCancelled = order.status === "CANCELLED";
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
    <div className="flex flex-col min-h-dvh bg-muted/30">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center h-12 px-4">
          <Link href="/orders" className="mr-3 p-1" aria-label="뒤로가기">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">주문상세</h1>
        </div>
      </header>

      <div className="flex-1 pb-6">
        {/* 주문 상태 프로그레스 */}
        <div className="bg-background px-4 py-6">
          {isCancelled ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <CircleX className="size-12 text-muted-foreground/60" />
              <p className="text-lg font-semibold">주문이 취소되었습니다</p>
            </div>
          ) : (
            <>
              <p className="text-center text-lg font-semibold mb-6">
                {ORDER_STEPS[currentStepIndex]?.label ?? order.status}
              </p>
              <div className="flex items-center justify-between px-2">
                {ORDER_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIndex;
                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div
                        className={`size-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span
                        className={`text-[10px] ${
                          isCompleted
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* 프로그레스 바 */}
              <div className="mx-8 mt-2 flex gap-1">
                {ORDER_STEPS.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-1 rounded-full ${
                      idx < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 가게 정보 */}
        <div className="bg-background mt-2 px-4 py-4">
          <h3 className="font-semibold text-sm">{order.restaurant.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
        </div>

        {/* 주문 메뉴 */}
        <div className="bg-background mt-2 px-4 py-4">
          <h3 className="font-semibold text-sm mb-3">주문 메뉴</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <span>{item.menu.name}</span>
                  <span className="text-muted-foreground ml-1">
                    {item.quantity}개
                  </span>
                </div>
                <span className="font-medium">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 정보 */}
        <div className="bg-background mt-2 px-4 py-4">
          <h3 className="font-semibold text-sm mb-3">결제정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문금액</span>
              <span>{menuTotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">배달비</span>
              <span>
                {deliveryFee === 0
                  ? "무료"
                  : `${deliveryFee.toLocaleString()}원`}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>총 결제금액</span>
              <span className="text-primary">
                {order.totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 배달 주소 */}
        <div className="bg-background mt-2 px-4 py-4">
          <h3 className="font-semibold text-sm mb-2">배달 주소</h3>
          <p className="text-sm text-muted-foreground">
            {order.deliveryAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
