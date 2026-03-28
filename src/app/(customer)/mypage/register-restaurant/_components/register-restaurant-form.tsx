"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Search } from "lucide-react";

import { ImageUpload } from "@/shared/ui/ImageUpload";
import { AddressSearch } from "@/shared/ui/address-search";
import type { PostcodeResult } from "@/shared/lib/kakao";
import { CATEGORY_LABELS } from "@/shared/config/constants";
import { registerRestaurant } from "../actions";

export function RegisterRestaurantForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("30");
  const [address, setAddress] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    name.trim().length > 0 && category !== "" && lat !== null && lng !== null;

  function handleAddressSelect(result: PostcodeResult) {
    setAddress(result.roadAddress);
    setLat(result.lat);
    setLng(result.lng);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await registerRestaurant({
        name,
        category,
        imageUrl,
        description: description.trim() || null,
        minOrderAmount: Number(minOrderAmount) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        deliveryTime: Number(deliveryTime) || 30,
        address,
        latitude: lat!,
        longitude: lng!,
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
      <header className="sticky top-0 z-10 bg-white flex items-center gap-3 px-4 h-14 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-900 hover:text-gray-600 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">음식점 등록</h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
        {/* 대표 이미지 */}
        <div className="flex flex-col items-center gap-2 mb-7">
          <ImageUpload
            category="restaurant"
            variant="banner"
            defaultImageUrl={imageUrl ?? undefined}
            onUploaded={(_objectKey, publicUrl) => setImageUrl(publicUrl)}
            onRemoved={() => setImageUrl(null)}
          />
          <span className="text-[12px] text-gray-400">음식점 대표 이미지</span>
        </div>

        {/* 음식점명 */}
        <FormField label="음식점명" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="음식점 이름을 입력해주세요"
            maxLength={50}
            className="form-input"
          />
          <p className="text-[11px] text-gray-400 text-right mt-1">
            {name.length}/50
          </p>
        </FormField>

        {/* 카테고리 */}
        <FormField label="카테고리" required>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input appearance-none"
          >
            <option value="">카테고리를 선택해주세요</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        {/* 소개글 */}
        <FormField label="소개글">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="음식점 소개를 입력해주세요"
            maxLength={500}
            rows={3}
            className="form-input resize-none"
          />
          <p className="text-[11px] text-gray-400 text-right mt-1">
            {description.length}/500
          </p>
        </FormField>

        {/* 음식점 주소 */}
        <FormField label="음식점 주소" required>
          <div className="relative">
            <input
              type="text"
              value={address ?? ""}
              placeholder="주소를 검색해주세요"
              readOnly
              className="form-input pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        </FormField>

        {/* 최소주문금액 + 배달비 (반절 행) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <FormField label="최소주문금액" required className="!mb-0">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0"
                min={0}
                className="form-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                원
              </span>
            </div>
          </FormField>
          <FormField label="배달비" required className="!mb-0">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="0"
                min={0}
                className="form-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                원
              </span>
            </div>
          </FormField>
        </div>

        {/* 배달시간 */}
        <FormField label="배달시간" required>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="30"
              min={10}
              max={120}
              className="form-input pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
              분
            </span>
          </div>
        </FormField>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-[13px] text-[#FF5252] text-center py-2">
            {error}
          </p>
        )}
      </div>

      {/* 등록 버튼 */}
      <div className="p-4 pb-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !isFormValid}
          className="w-full bg-[#2DB400] text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-[#269900] active:bg-[#1F8000] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              등록 중...
            </span>
          ) : (
            "음식점 등록하기"
          )}
        </button>
      </div>

      {/* 글로벌 폼 인풋 스타일 */}
      <style jsx global>{`
        .form-input {
          width: 100%;
          background-color: rgb(249 250 251);
          border-radius: 0.5rem;
          padding: 0.75rem 0.875rem;
          font-size: 15px;
          color: rgb(17 24 39);
          outline: none;
          border: 1px solid rgb(243 244 246);
          transition: border-color 0.15s;
        }
        .form-input:focus {
          border-color: #2DB400;
        }
        .form-input::placeholder {
          color: rgb(156 163 175);
        }
      `}</style>
    </div>
  );
}

/** 폼 필드 래퍼 */
function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className ?? ""}`}>
      <label className="text-[13px] text-gray-500 mb-2 block">
        {label}
        {required && <span className="text-[#FF5252] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
