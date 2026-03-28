"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Search } from "lucide-react";

import { AddressSearch } from "@/components/address-search";
import type { PostcodeResult } from "@/lib/kakao";
import { registerRider } from "../actions";

const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "도보",
  BICYCLE: "자전거",
  MOTORCYCLE: "오토바이",
  CAR: "자동차",
};

export function RegisterRiderForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transportType, setTransportType] = useState("");
  const [activityArea, setActivityArea] = useState<string | null>(null);
  const [activityLat, setActivityLat] = useState<number | null>(null);
  const [activityLng, setActivityLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    transportType !== "" &&
    activityLat !== null &&
    activityLng !== null;

  function handleAddressSelect(result: PostcodeResult) {
    setActivityArea(result.roadAddress);
    setActivityLat(result.lat);
    setActivityLng(result.lng);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await registerRider({
        name,
        phone,
        transportType,
        activityArea,
        activityLat,
        activityLng,
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
        <h1 className="font-bold text-[17px] text-gray-900">배달기사 등록</h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
        {/* 이름 */}
        <FormField label="이름" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            maxLength={30}
            className="form-input"
          />
          <p className="text-[11px] text-gray-400 text-right mt-1">
            {name.length}/30
          </p>
        </FormField>

        {/* 전화번호 */}
        <FormField label="전화번호" required>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            maxLength={13}
            className="form-input"
          />
        </FormField>

        {/* 이동수단 */}
        <FormField label="이동수단" required>
          <select
            value={transportType}
            onChange={(e) => setTransportType(e.target.value)}
            className="form-input appearance-none"
          >
            <option value="">이동수단을 선택해주세요</option>
            {Object.entries(TRANSPORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        {/* 활동 지역 주소 */}
        <FormField label="활동 지역 주소" required>
          <div className="relative">
            <input
              type="text"
              value={activityArea ?? ""}
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
            "배달기사 등록하기"
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
