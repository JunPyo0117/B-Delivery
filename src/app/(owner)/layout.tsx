import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OwnerNav } from "./_components/owner-nav";

/**
 * Owner 레이아웃 — OWNER 또는 ADMIN 역할만 접근 가능
 * 비로그인 또는 권한 없는 유저는 홈(/)으로 리다이렉트
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

  return (
    <div className="flex flex-col min-h-dvh">
      <OwnerNav />
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
