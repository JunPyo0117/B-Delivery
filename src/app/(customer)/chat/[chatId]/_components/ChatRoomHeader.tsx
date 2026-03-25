"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ChatRoomHeaderProps {
  restaurantName: string;
}

export function ChatRoomHeader({ restaurantName }: ChatRoomHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center h-12 px-4 border-b bg-background shrink-0">
      <button
        onClick={() => router.push("/chat")}
        className="p-1 -ml-1 mr-3"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="text-base font-semibold truncate">{restaurantName}</h1>
    </header>
  );
}
