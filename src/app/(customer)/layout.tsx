import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "./_components/bottom-nav";

/** 주소 미설정 시 리다이렉션을 건너뛸 경로 */
const ADDRESS_EXEMPT_PATHS = [
  "/mypage/addresses",
  "/mypage/profile",
  "/login",
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 로그인된 유저의 기본 주소가 없으면 주소 등록으로 유도
  if (session?.user && !session.user.defaultAddress) {
    const headersList = await headers();
    const pathname = headersList.get("x-next-pathname") ?? "";
    const isExempt = ADDRESS_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

    if (!isExempt) {
      redirect("/mypage/addresses/new");
    }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-14">{children}</main>
      <BottomNav />
    </div>
  );
}
