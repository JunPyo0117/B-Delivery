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
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white flex items-center gap-3 px-4 h-14 border-b border-gray-100">
        <Link
          href="/mypage"
          className="text-gray-900 hover:text-gray-600 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-bold text-[17px] text-gray-900">주소 관리</h1>
      </header>

      <AddressList addresses={addresses} />
    </div>
  );
}
