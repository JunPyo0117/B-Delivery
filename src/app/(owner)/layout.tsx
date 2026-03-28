import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { redirect } from "next/navigation";
import { OwnerSidebar } from "./_components/owner-sidebar";
import { PcOnlyGuard } from "./_components/pc-only-guard";

/**
 * Owner 레이아웃
 *
 * - OWNER 또는 ADMIN 역할만 접근 가능
 * - PC 전용 (min-width: 1024px) — 모바일에서는 안내 메시지 표시
 * - 왼쪽 사이드바(240px) + 메인 콘텐츠 영역
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "OWNER" && session.user.role !== "ADMIN")
  ) {
    redirect("/");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      isOpen: true,
    },
  });

  const restaurantName = restaurant?.name ?? "음식점 미등록";
  const restaurantId = restaurant?.id ?? "";
  const restaurantIsOpen = restaurant?.isOpen ?? false;

  return (
    <PcOnlyGuard>
      <div className="flex min-h-dvh bg-gray-50">
        <OwnerSidebar
          restaurantName={restaurantName}
          restaurantId={restaurantId}
          initialIsOpen={restaurantIsOpen}
        />
        <main className="ml-[240px] flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </PcOnlyGuard>
  );
}
