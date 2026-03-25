import { auth } from "@/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "관리자 대시보드" };

export default async function AdminPage() {
  const session = await auth();

  const [userCount, pendingReportCount] = await Promise.all([
    prisma.user.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  const menuItems = [
    {
      title: "유저 관리",
      description: `총 ${userCount}명의 회원`,
      href: "/admin/users",
    },
    {
      title: "신고 관리",
      description: `대기 ${pendingReportCount}건`,
      href: "/admin/reports",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <p className="mt-2 text-muted-foreground">
        안녕하세요, {session?.user.nickname}님
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border p-5 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
