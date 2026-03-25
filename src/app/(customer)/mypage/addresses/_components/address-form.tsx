"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressSearch } from "@/components/address-search";
import type { PostcodeResult } from "@/lib/kakao";
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
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 h-12 border-b">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-bold text-lg">
          {mode === "create" ? "주소 추가" : "주소 수정"}
        </h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 flex flex-col gap-6 p-4">
        {/* 별칭 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="label">별칭</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 집, 회사"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground text-right">
            {label.length}/20
          </p>
        </div>

        {/* 주소 검색 */}
        <div className="flex flex-col gap-2">
          <Label>배달 주소</Label>
          <Input
            value={address}
            placeholder="주소를 검색해주세요"
            readOnly
          />
          <AddressSearch onSelect={handleAddressSelect} />
        </div>

        {/* 상세 주소 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="addressDetail">상세주소</Label>
          <Input
            id="addressDetail"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="동/호수를 입력해주세요"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !isValid}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            "저장하기"
          )}
        </Button>
      </div>
    </div>
  );
}
