"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  title: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white border-b border-gray-100">
      <button
        onClick={() => router.back()}
        className="p-1.5 -ml-1.5 mr-3 rounded-full active:bg-gray-100 transition-colors"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5 text-gray-800" />
      </button>
      <h1 className="text-[17px] font-bold text-gray-900">{title}</h1>
    </header>
  );
}
