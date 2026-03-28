import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MyPage } from "@/views/my-page";

export default async function MypagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { nickname, image, role } = session.user;

  return <MyPage nickname={nickname} image={image ?? null} role={role} />;
}
