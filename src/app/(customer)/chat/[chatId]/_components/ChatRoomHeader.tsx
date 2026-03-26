"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ChatRoomHeaderProps {
  restaurantName: string;
  orderId?: string;
}

export function ChatRoomHeader({ restaurantName, orderId }: ChatRoomHeaderProps) {
  const router = useRouter();

  const shortOrderId = orderId ? `#${orderId.slice(0, 4).toUpperCase()}` : "";

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white border-b border-gray-100 shrink-0">
      <button
        onClick={() => router.push("/chat")}
        className="p-1.5 -ml-1.5 mr-3 rounded-full active:bg-gray-100 transition-colors"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5 text-gray-800" />
      </button>

      <div className="flex-1 min-w-0 text-center mr-8">
        <h1 className="text-[16px] font-bold text-gray-900 truncate">
          고객센터
        </h1>
        {orderId && (
          <p className="text-[11px] text-gray-400 truncate -mt-0.5">
            주문 {shortOrderId} · {restaurantName}
          </p>
        )}
      </div>
    </header>
  );
}
