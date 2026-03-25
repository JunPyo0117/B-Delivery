import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Pencil,
  Ticket,
  Gift,
  CircleDollarSign,
  MapPin,
  MessageSquare,
  Star,
  Store,
} from "lucide-react";

import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MypageHeader } from "./_components/mypage-header";

export default async function MypagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { nickname, image, defaultAddress, role } = session.user;

  return (
    <div className="flex flex-col">
      <MypageHeader />

      {/* 프로필 섹션 */}
      <section className="flex flex-col items-center gap-2 py-6">
        <Avatar className="size-20">
          <AvatarImage src={image ?? undefined} alt={nickname} />
          <AvatarFallback className="text-2xl">
            {nickname.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg">{nickname}</span>
          <Link
            href="/mypage/profile"
            className="text-muted-foreground hover:text-foreground"
            aria-label="프로필 수정"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
      </section>

      <Separator />

      {/* 기본 주소 */}
      <section className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">
            {defaultAddress ?? "기본 배달 주소를 설정해주세요"}
          </span>
        </div>
      </section>

      <Separator />

      {/* 쿠폰 / 포인트 / 선물함 */}
      <section className="grid grid-cols-3 divide-x py-4">
        <div className="flex flex-col items-center gap-1">
          <Ticket className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">쿠폰함</span>
          <span className="text-sm font-semibold">0장</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CircleDollarSign className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">포인트</span>
          <span className="text-sm font-semibold">0원</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Gift className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">선물함</span>
          <span className="text-sm font-semibold">0개</span>
        </div>
      </section>

      <Separator className="h-2 bg-muted" />

      {/* 메뉴 리스트 */}
      <nav className="flex flex-col">
        <MenuItem
          icon={<Star className="size-5" />}
          label="리뷰관리"
          href="/mypage"
        />
        <MenuItem
          icon={<MapPin className="size-5" />}
          label="주소관리"
          href="/mypage/addresses"
        />
        <MenuItem
          icon={<MessageSquare className="size-5" />}
          label="고객센터"
          href="/mypage"
        />
        {role === "USER" && (
          <MenuItem
            icon={<Store className="size-5" />}
            label="음식점 등록하기"
            href="/mypage/register-restaurant"
          />
        )}
      </nav>
    </div>
  );
}

function MenuItem({
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
      className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
