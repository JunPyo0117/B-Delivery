"use client";

import { useRef, useState, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import { ImagePlus, Send } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ChatInputProps {
  onSendText: (content: string) => void;
  onSendImage: (publicUrl: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendText, onSendImage, onTyping, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status: uploadStatus, progress, upload, reset: resetUpload } = useImageUpload({
    category: "chat",
    onSuccess: (_objectKey, publicUrl) => {
      onSendImage(publicUrl);
      resetUpload();
    },
  });

  const isUploading = uploadStatus === "compressing" || uploadStatus === "uploading";

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendText(trimmed);
    setText("");
    onTyping(false);
    // textarea 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSendText, onTyping]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      onTyping(e.target.value.length > 0);

      // auto-resize (max 4줄)
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 96) + "px";
    },
    [onTyping]
  );

  const handleImageSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload]
  );

  return (
    <div className="shrink-0 border-t bg-background px-3 py-2">
      {/* 업로드 프로그레스 */}
      {isUploading && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2AC1BC] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 이미지 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-40"
          aria-label="이미지 전송"
        >
          <ImagePlus className="size-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* 텍스트 입력 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-2xl border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2AC1BC] placeholder:text-gray-400 disabled:opacity-40"
          style={{ maxHeight: 96 }}
        />

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="p-2 text-[#2AC1BC] disabled:opacity-40"
          aria-label="전송"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}
