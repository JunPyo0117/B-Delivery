import { auth } from "@/auth";
import { getDashboardData } from "./_actions/get-dashboard-data";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata = { title: "관리자 대시보드 - B-Delivery" };

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  return (
    <DashboardClient
      data={data}
      nickname={session?.user.nickname ?? "관리자"}
    />
  );
}
