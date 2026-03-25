"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  title: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center h-12 px-4 border-b bg-background">
      <button
        onClick={() => router.back()}
        className="p-1 -ml-1 mr-3"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}
