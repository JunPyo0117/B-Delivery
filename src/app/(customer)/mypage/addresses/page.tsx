import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AddressList } from "./_components/address-list";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      label: true,
      address: true,
      addressDetail: true,
      isDefault: true,
    },
  });

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 h-12 border-b">
        <Link
          href="/mypage"
          className="text-muted-foreground hover:text-foreground"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-bold text-lg">주소 관리</h1>
      </header>

      <AddressList addresses={addresses} />
    </div>
  );
}
