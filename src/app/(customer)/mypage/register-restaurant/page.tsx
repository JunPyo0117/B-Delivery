import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterRestaurantForm } from "./_components/register-restaurant-form";

export default async function RegisterRestaurantPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect("/mypage");

  return <RegisterRestaurantForm />;
}
