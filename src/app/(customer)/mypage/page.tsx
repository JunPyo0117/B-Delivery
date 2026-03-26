import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Ticket,
  Gift,
  Coins,
  MapPin,
  Store,
  LogOut,
} from "lucide-react";

import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MypageHeader } from "./_components/mypage-header";
import { LogoutButton } from "./_components/logout-button";

export default async function MypagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { nickname, image, role } = session.user;

  return (
    <div className="flex flex-col pb-20 bg-white min-h-dvh">
      <MypageHeader />

      {/* 프로필 섹션 */}
      <section className="flex flex-col items-center gap-3 pt-4 pb-7">
        <Avatar className="size-16 ring-2 ring-gray-100">
          <AvatarImage src={image ?? undefined} alt={nickname} />
          <AvatarFallback className="text-2xl bg-gray-100 text-gray-500 font-medium">
            {nickname.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-2.5">
          <span className="font-bold text-[17px] text-gray-900">{nickname}</span>
          <Link
            href="/mypage/profile"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            프로필 수정
          </Link>
        </div>
      </section>

      {/* 두꺼운 구분선 */}
      <div className="h-2 bg-gray-100" />

      {/* 쿠폰 / 포인트 / 선물함 */}
      <section className="px-4">
        <MenuValueRow
          icon={<Ticket className="size-[18px] text-gray-400" />}
          label="쿠폰함"
          value="2장"
          valueColor="text-[#2DB400]"
          href="#"
        />
        <div className="h-px bg-gray-100 ml-10" />
        <MenuValueRow
          icon={<Coins className="size-[18px] text-gray-400" />}
          label="포인트"
          value="0원"
          href="#"
        />
        <div className="h-px bg-gray-100 ml-10" />
        <MenuValueRow
          icon={<Gift className="size-[18px] text-gray-400" />}
          label="선물함"
          value="0원"
          href="#"
        />
      </section>

      {/* 두꺼운 구분선 */}
      <div className="h-2 bg-gray-100" />

      {/* 설정 메뉴 리스트 */}
      <nav className="px-4">
        <SettingsRow
          icon={<Pencil className="size-[18px]" />}
          label="리뷰관리"
          href="/mypage/reviews"
        />
        <div className="h-px bg-gray-100 ml-10" />
        <SettingsRow
          icon={<MapPin className="size-[18px]" />}
          label="주소관리"
          href="/mypage/addresses"
        />
        <div className="h-px bg-gray-100 ml-10" />
        {role === "USER" && (
          <>
            <SettingsRow
              icon={<Store className="size-[18px]" />}
              label="음식점 등록하기"
              href="/mypage/register-restaurant"
            />
          </>
        )}
      </nav>

      {/* 구분선 + 로그아웃 */}
      <div className="h-2 bg-gray-100" />
      <div className="px-4 py-2">
        <LogoutButton />
      </div>
    </div>
  );
}

/** 값이 있는 메뉴 행 */
function MenuValueRow({
  icon,
  label,
  value,
  valueColor = "text-gray-900",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 hover:bg-gray-50/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="w-6 flex items-center justify-center">{icon}</span>
        <span className="text-[15px] text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-[15px] font-semibold ${valueColor}`}>
          {value}
        </span>
        <ChevronRight className="size-4 text-gray-300" />
      </div>
    </Link>
  );
}

/** 설정 행 */
function SettingsRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 hover:bg-gray-50/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="w-6 flex items-center justify-center text-gray-400">
          {icon}
        </span>
        <span className="text-[15px] text-gray-900">{label}</span>
      </div>
      <ChevronRight className="size-4 text-gray-300" />
    </Link>
  );
}
