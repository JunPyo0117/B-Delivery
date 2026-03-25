"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";

interface RestaurantHeaderProps {
  imageUrl: string | null;
  name: string;
}

export function RestaurantHeader({ imageUrl, name }: RestaurantHeaderProps) {
  const router = useRouter();

  return (
    <div className="relative aspect-[4/3] w-full bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          이미지 없음
        </div>
      )}

      {/* 상단 네비게이션 오버레이 */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <button
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5" />
        </button>

        <button
          className="flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          aria-label="장바구니"
        >
          <ShoppingCart className="size-5" />
        </button>
      </div>
    </div>
  );
}
