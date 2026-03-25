import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditForm } from "../_components/profile-edit-form";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nickname: true,
      image: true,
      defaultAddress: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <ProfileEditForm
      initialData={{
        nickname: user.nickname,
        image: user.image,
        defaultAddress: user.defaultAddress,
        latitude: user.latitude,
        longitude: user.longitude,
      }}
    />
  );
}
