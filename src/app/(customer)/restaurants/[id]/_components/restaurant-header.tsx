"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart";

interface RestaurantHeaderProps {
  imageUrl: string | null;
  name: string;
}

export function RestaurantHeader({ imageUrl, name }: RestaurantHeaderProps) {
  const router = useRouter();
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

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
          onClick={() => router.push("/cart")}
          className="relative flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          aria-label="장바구니"
        >
          <ShoppingCart className="size-5" />
          {totalQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#00C4B4] text-[10px] font-bold text-white">
              {totalQuantity > 99 ? "99+" : totalQuantity}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
