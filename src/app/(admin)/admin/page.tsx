import { auth } from "@/auth";

export const metadata = { title: "관리자 대시보드" };

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <p className="mt-2 text-muted-foreground">
        안녕하세요, {session?.user.nickname}님
      </p>
    </main>
  );
}
