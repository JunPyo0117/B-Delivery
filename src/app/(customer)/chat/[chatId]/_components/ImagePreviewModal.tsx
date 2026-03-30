"use client";

import { X } from "lucide-react";

interface ImagePreviewModalProps {
  src: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="닫기"
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt="이미지 미리보기"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
