"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { AddressSearch } from "@/components/address-search";
import type { PostcodeResult } from "@/lib/kakao";
import { CATEGORY_LABELS } from "@/lib/constants";
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
        <h1 className="font-bold text-lg">음식점 등록</h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-4">
        {/* 대표 이미지 */}
        <div className="flex flex-col items-center gap-2">
          <ImageUpload
            category="restaurant"
            variant="banner"
            defaultImageUrl={imageUrl ?? undefined}
            onUploaded={(_objectKey, publicUrl) => setImageUrl(publicUrl)}
            onRemoved={() => setImageUrl(null)}
          />
          <span className="text-xs text-muted-foreground">
            음식점 대표 이미지
          </span>
        </div>

        {/* 음식점 이름 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            음식점 이름 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="음식점 이름을 입력해주세요"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground text-right">
            {name.length}/50
          </p>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">
            카테고리 <span className="text-destructive">*</span>
          </Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">카테고리를 선택해주세요</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 소개글 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">소개글</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="음식점 소개를 입력해주세요"
            maxLength={500}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/500
          </p>
        </div>

        {/* 최소 주문 금액 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="minOrderAmount">
            최소 주문 금액 <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="minOrderAmount"
              type="number"
              inputMode="numeric"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="0"
              min={0}
            />
            <span className="text-sm text-muted-foreground shrink-0">원</span>
          </div>
        </div>

        {/* 배달비 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="deliveryFee">
            배달비 <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="deliveryFee"
              type="number"
              inputMode="numeric"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="0"
              min={0}
            />
            <span className="text-sm text-muted-foreground shrink-0">원</span>
          </div>
        </div>

        {/* 예상 배달 시간 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="deliveryTime">
            예상 배달 시간 <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="deliveryTime"
              type="number"
              inputMode="numeric"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="30"
              min={10}
              max={120}
            />
            <span className="text-sm text-muted-foreground shrink-0">분</span>
          </div>
        </div>

        {/* 주소 */}
        <div className="flex flex-col gap-2">
          <Label>
            주소 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={address ?? ""}
            placeholder="주소를 검색해주세요"
            readOnly
          />
          <AddressSearch onSelect={handleAddressSelect} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      {/* 등록 버튼 */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !isFormValid}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              등록 중...
            </>
          ) : (
            "등록하기"
          )}
        </Button>
      </div>
    </div>
  );
}
