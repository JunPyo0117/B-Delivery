import { redirect } from "next/navigation";
import Link from "next/link";
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
  ClipboardList,
  Heart,
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
    <div className="flex flex-col pb-20">
      <MypageHeader />

      {/* 프로필 섹션 */}
      <section className="flex flex-col items-center gap-3 py-6">
        <Avatar className="size-20">
          <AvatarImage src={image ?? undefined} alt={nickname} />
          <AvatarFallback className="text-2xl bg-muted">
            {nickname.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">{nickname}</span>
            <Pencil className="size-3.5 text-muted-foreground" />
          </div>

          {/* 프로필 수정 버튼 */}
          <Link
            href="/mypage/profile"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            프로필 수정
          </Link>
        </div>
      </section>

      <Separator />

      {/* 기본 주소 */}
      <section className="px-4 py-3">
        <Link
          href="/mypage/addresses"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MapPin className="size-4 shrink-0" />
          <span className="truncate flex-1">
            {defaultAddress ?? "기본 배달 주소를 설정해주세요"}
          </span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
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
          icon={<ClipboardList className="size-5" />}
          label="주문내역"
          href="/orders"
        />
        <MenuItem
          icon={<Heart className="size-5" />}
          label="찜 목록"
          href="/mypage/favorites"
        />
        <MenuItem
          icon={<Star className="size-5" />}
          label="리뷰관리"
          href="/mypage/reviews"
        />
        <MenuItem
          icon={<MapPin className="size-5" />}
          label="주소관리"
          href="/mypage/addresses"
        />
        <MenuItem
          icon={<MessageSquare className="size-5" />}
          label="고객센터"
          href="/chat"
        />

        {/* USER 역할일 때만 음식점 등록 버튼 표시 (OWNER는 이미 등록 완료) */}
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

/** 마이페이지 메뉴 아이템 컴포넌트 */
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
