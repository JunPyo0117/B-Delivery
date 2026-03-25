import { notFound } from "next/navigation";
import { getUserDetail } from "../actions";
import { UserDetailClient } from "./_components/user-detail-client";

export const metadata = { title: "유저 상세 | 관리자" };

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;

  try {
    const user = await getUserDetail(userId);
    return <UserDetailClient user={JSON.parse(JSON.stringify(user))} />;
  } catch {
    notFound();
  }
}
