import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import {
  User,
  Bike,
  MapPin,
  Package,
  Wallet,
  ChevronRight,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { formatPrice } from "@/shared/lib";
import { RiderLogoutButton } from "./_components/rider-logout-button";

const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "도보",
  BICYCLE: "자전거",
  MOTORCYCLE: "오토바이",
  CAR: "자동차",
};

/**
 * 기사 마이페이지
 *
 * - 프로필 (닉네임, 이동수단, 활동지역)
 * - 통계 (총 배달 건수, 총 수익)
 * - 메뉴: 수익 요약, 고객센터 채팅
 */
export default async function RiderMyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [profile, riderProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        nickname: true,
        email: true,
        image: true,
      },
    }),
    prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  if (!profile || !riderProfile) {
    redirect("/mypage/register-rider");
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[20px] font-bold text-gray-900">마이페이지</h1>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* 프로필 카드 */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4 mb-4">
            {/* 프로필 이미지 */}
            <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.nickname}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-8 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-[17px] font-bold text-gray-900">
                {profile.nickname}
              </p>
              <p className="text-[13px] text-gray-500">{profile.email}</p>
            </div>
          </div>

          {/* 기사 정보 */}
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex items-center gap-2 text-gray-600">
              <Bike className="size-4 text-gray-400" />
              <span>
                이동수단:{" "}
                <span className="font-medium text-gray-900">
                  {TRANSPORT_LABELS[riderProfile.transportType] ??
                    riderProfile.transportType}
                </span>
              </span>
            </div>
            {riderProfile.activityArea && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="size-4 text-gray-400" />
                <span>
                  활동지역:{" "}
                  <span className="font-medium text-gray-900">
                    {riderProfile.activityArea}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-4 text-blue-500" />
              <p className="text-[12px] text-gray-500">총 배달</p>
            </div>
            <p className="text-[20px] font-bold text-gray-900">
              {riderProfile.totalDeliveries}건
            </p>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="size-4 text-[#2DB400]" />
              <p className="text-[12px] text-gray-500">총 수익</p>
            </div>
            <p className="text-[20px] font-bold text-gray-900">
              {formatPrice(riderProfile.totalEarnings)}
            </p>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <MenuLink
            href="/rider/earnings"
            icon={<BarChart3 className="size-5 text-[#2DB400]" />}
            label="수익 요약"
          />
          <MenuLink
            href="/chat"
            icon={<MessageCircle className="size-5 text-blue-500" />}
            label="고객센터 채팅"
          />
          <MenuLink
            href="/mypage/profile"
            icon={<Settings className="size-5 text-gray-500" />}
            label="프로필 수정"
            isLast
          />
        </div>

        {/* 로그아웃 */}
        <RiderLogoutButton />
      </div>
    </div>
  );
}

/** 메뉴 링크 아이템 */
function MenuLink({
  href,
  icon,
  label,
  isLast = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isLast?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[14px] text-gray-900">{label}</span>
      </div>
      <ChevronRight className="size-4 text-gray-400" />
    </Link>
  );
}
