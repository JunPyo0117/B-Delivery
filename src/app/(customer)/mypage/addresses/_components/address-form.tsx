"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { AddressSearch } from "@/shared/ui/address-search";
import type { PostcodeResult } from "@/shared/lib/kakao";
import { createAddress, updateAddress } from "../actions";

interface AddressFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    label: string;
    address: string;
    addressDetail: string | null;
    latitude: number;
    longitude: number;
  };
}

export function AddressForm({ mode, initialData }: AddressFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [label, setLabel] = useState(initialData?.label ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [addressDetail, setAddressDetail] = useState(
    initialData?.addressDetail ?? ""
  );
  const [lat, setLat] = useState<number | null>(
    initialData?.latitude ?? null
  );
  const [lng, setLng] = useState<number | null>(
    initialData?.longitude ?? null
  );
  const [error, setError] = useState<string | null>(null);

  function handleAddressSelect(result: PostcodeResult) {
    setAddress(result.roadAddress);
    setLat(result.lat);
    setLng(result.lng);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAddress({
              label,
              address,
              addressDetail: addressDetail || undefined,
              latitude: lat!,
              longitude: lng!,
            })
          : await updateAddress({
              id: initialData!.id,
              label,
              address,
              addressDetail: addressDetail || undefined,
              latitude: lat!,
              longitude: lng!,
            });

      if (result.error) {
        setError(result.error);
        return;
      }

      await updateSession();
      router.push("/mypage/addresses");
      router.refresh();
    });
  }

  const isValid = label.trim() && address && lat != null && lng != null;

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
        <h1 className="font-bold text-[17px] text-gray-900">
          {mode === "create" ? "주소 추가" : "주소 수정"}
        </h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 flex flex-col gap-5 p-4 pt-5">
        {/* 별칭 */}
        <div>
          <label className="text-[13px] text-gray-500 mb-2 block">별칭</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 집, 회사"
            maxLength={20}
            className="w-full bg-gray-50 rounded-lg px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none border border-gray-100 focus:border-[#2DB400] transition-colors"
          />
          <p className="text-[11px] text-gray-400 text-right mt-1.5">
            {label.length}/20
          </p>
        </div>

        {/* 주소 검색 */}
        <div>
          <label className="text-[13px] text-gray-500 mb-2 block">
            배달 주소
          </label>
          <input
            type="text"
            value={address}
            placeholder="주소를 검색해주세요"
            readOnly
            className="w-full bg-gray-50 rounded-lg px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none border border-gray-100"
          />
          <div className="mt-2">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        </div>

        {/* 상세 주소 */}
        <div>
          <label className="text-[13px] text-gray-500 mb-2 block">
            상세주소
          </label>
          <input
            type="text"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="동/호수를 입력해주세요"
            className="w-full bg-gray-50 rounded-lg px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none border border-gray-100 focus:border-[#2DB400] transition-colors"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-[13px] text-[#FF5252] text-center">{error}</p>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="p-4 pb-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !isValid}
          className="w-full bg-[#2DB400] text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-[#269900] active:bg-[#1F8000] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              저장 중...
            </span>
          ) : (
            "저장하기"
          )}
        </button>
      </div>
    </div>
  );
}
