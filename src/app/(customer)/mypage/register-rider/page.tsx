import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterRiderForm } from "./_components/register-rider-form";

export default async function RegisterRiderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect("/mypage");

  return <RegisterRiderForm />;
}
