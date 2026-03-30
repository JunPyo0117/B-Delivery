import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RiderBottomNav } from "./_components/rider-bottom-nav";

/**
 * RIDER 전용 레이아웃
 *
 * - RIDER 또는 ADMIN 역할만 접근 가능
 * - 모바일 레이아웃: mx-auto max-w-[480px]
 * - 하단에 RiderBottomNav 포함
 */
export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "RIDER" && session.user.role !== "ADMIN")
  ) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col min-h-dvh">
      <main className="flex-1 pb-20">{children}</main>
      <RiderBottomNav />
    </div>
  );
}
