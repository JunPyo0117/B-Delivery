"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Camera, ChevronRight, Loader2 } from "lucide-react";

import { ImageUpload } from "@/components/ImageUpload";
import { AddressSearch } from "@/components/address-search";
import type { PostcodeResult } from "@/lib/kakao";
import { updateProfile } from "../actions";

interface ProfileEditFormProps {
  initialData: {
    nickname: string;
    image: string | null;
    defaultAddress: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [nickname, setNickname] = useState(initialData.nickname);
  const [imageUrl, setImageUrl] = useState<string | null>(initialData.image);
  const [address, setAddress] = useState<string | null>(
    initialData.defaultAddress
  );
  const [lat, setLat] = useState<number | null>(initialData.latitude);
  const [lng, setLng] = useState<number | null>(initialData.longitude);
  const [error, setError] = useState<string | null>(null);

  function handleAddressSelect(result: PostcodeResult) {
    setAddress(result.roadAddress);
    setLat(result.lat);
    setLng(result.lng);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await updateProfile({
        nickname,
        image: imageUrl,
        defaultAddress: address,
        latitude: lat,
        longitude: lng,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      await updateSession();
      router.push("/mypage");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 h-14 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-900 hover:text-gray-600 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-[17px] text-gray-900">
          프로필 수정
        </h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !nickname.trim()}
          className="text-[15px] font-semibold text-[#2DB400] disabled:text-gray-300 transition-colors"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "저장"
          )}
        </button>
      </header>

      {/* 프로필 이미지 */}
      <div className="flex flex-col items-center gap-2 pt-8 pb-6">
        <div className="relative">
          <ImageUpload
            category="profile"
            variant="circle"
            defaultImageUrl={imageUrl ?? undefined}
            onUploaded={(_objectKey, publicUrl) => setImageUrl(publicUrl)}
            onRemoved={() => setImageUrl(null)}
          />
          <div className="absolute bottom-0 right-0 size-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Camera className="size-3.5 text-gray-500" />
          </div>
        </div>
        <button
          type="button"
          className="text-[13px] font-medium text-[#2DB400] mt-1"
        >
          사진 변경
        </button>
      </div>

      {/* 폼 필드 */}
      <div className="flex flex-col px-4 gap-0">
        {/* 닉네임 */}
        <div className="py-4">
          <label className="text-[13px] text-gray-500 mb-2 block">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            maxLength={20}
            className="w-full bg-gray-50 rounded-lg px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none border border-gray-100 focus:border-[#2DB400] transition-colors"
          />
          <p className="text-[11px] text-gray-400 text-right mt-1.5">
            {nickname.length}/20
          </p>
        </div>

        <div className="h-px bg-gray-100" />

        {/* 이메일 (readonly) */}
        <div className="py-4">
          <label className="text-[13px] text-gray-500 mb-2 block">이메일</label>
          <div className="w-full bg-gray-100 rounded-lg px-3.5 py-3 text-[15px] text-gray-500">
            Google 연동 계정
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* 기본 배달 주소 */}
        <div className="py-4">
          <label className="text-[13px] text-gray-500 mb-2 block">
            기본 배달 주소
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={address ?? ""}
              placeholder="주소를 검색해주세요"
              readOnly
              className="flex-1 bg-gray-50 rounded-lg px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none border border-gray-100"
            />
            <ChevronRight className="size-5 text-gray-300 shrink-0" />
          </div>
          <div className="mt-2">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-[13px] text-[#FF5252] text-center px-4 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
