import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RestaurantInfoForm } from "./_components/restaurant-info-form";

export const metadata = { title: "가게 정보 수정 - B-Delivery" };

export default async function RestaurantInfoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-gray-500">등록된 음식점이 없습니다.</p>
      </div>
    );
  }

  return <RestaurantInfoForm restaurant={restaurant} />;
}
