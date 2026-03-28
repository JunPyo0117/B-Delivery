import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { HomePage } from "@/pages/home";

export default async function HomeRoute() {
  const session = await auth();

  // OWNER는 사장 대시보드로 리다이렉트
  if (session?.user?.role === "OWNER") {
    redirect("/owner/dashboard");
  }

  // JWT가 stale할 수 있으므로 DB에서 최신 주소를 직접 조회
  let address: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultAddress: true, latitude: true, longitude: true },
    });
    if (dbUser) {
      address = dbUser.defaultAddress;
      latitude = dbUser.latitude;
      longitude = dbUser.longitude;
    }
  }

  return (
    <HomePage
      address={address}
      latitude={latitude}
      longitude={longitude}
    />
  );
}
