import { auth } from "@/auth";
import { getChatList, getUnreadCount } from "./actions";
import { CsPageClient } from "./_components/cs-page-client";

export const metadata = { title: "고객센터 - B-Delivery Admin" };

export const dynamic = "force-dynamic";

export default async function AdminCsPage() {
  const session = await auth();
  const [chatList, waitingCount] = await Promise.all([
    getChatList({ status: "WAITING" }),
    getUnreadCount(),
  ]);

  return (
    <CsPageClient
      initialChats={chatList}
      waitingCount={waitingCount}
      adminNickname={session?.user.nickname ?? "관리자"}
      adminId={session!.user.id}
    />
  );
}
