import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderList } from "./_components/order-list";
import type { OwnerOrder } from "./_actions/get-orders";

export const metadata = { title: "주문 관리 - B-Delivery 사장님" };

export default async function OwnerOrdersPage() {
  const session = await auth();

  // 사장님이 소유한 음식점 조회
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    return (
      <div>
        <div
          className="px-4 py-5"
          style={{ backgroundColor: "#2DB400" }}
        >
          <h1 className="text-lg font-bold text-white">주문 관리</h1>
        </div>
        <div className="p-4">
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-500">
              등록된 음식점이 없습니다. 음식점을 먼저 등록해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 초기 주문 데이터 조회 (최신순)
  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      user: { select: { nickname: true } },
      items: {
        include: {
          menu: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const initialOrders: OwnerOrder[] = orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    deliveryAddress: order.deliveryAddress,
    customerNickname: order.user.nickname,
    items: order.items.map((item) => ({
      id: item.id,
      menuName: item.menu.name,
      quantity: item.quantity,
      price: item.price,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

  return <OrderList initialOrders={initialOrders} restaurantName={restaurant.name} />;
}
