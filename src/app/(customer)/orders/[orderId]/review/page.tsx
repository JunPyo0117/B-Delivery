import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "./_components/review-form";

export default async function ReviewPage({
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
      restaurant: { select: { id: true, name: true } },
      items: {
        include: { menu: { select: { name: true } } },
      },
      review: { select: { id: true } },
    },
  });

  if (!order) notFound();

  // 본인 주문만 접근 가능
  if (order.userId !== session.user.id) {
    redirect("/");
  }

  // 배달 완료 상태만 리뷰 가능
  if (order.status !== "DONE") {
    redirect("/");
  }

  // 이미 리뷰 작성됨 -> 음식점 상세로 리다이렉트
  if (order.review) {
    redirect(`/restaurants/${order.restaurantId}`);
  }

  // 메뉴 요약 (예: "후라이드치킨 외 2개")
  const menuNames = order.items.map(
    (item) => `${item.menu.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`
  );
  const menuSummary =
    menuNames.length <= 2
      ? menuNames.join(", ")
      : `${menuNames[0]} 외 ${menuNames.length - 1}개`;

  return (
    <ReviewForm
      order={{
        orderId: order.id,
        restaurantName: order.restaurant.name,
        restaurantId: order.restaurant.id,
        menuSummary,
      }}
    />
  );
}
