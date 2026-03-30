"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";

import { ImageUpload } from "@/shared/ui/ImageUpload";
import { AddressSearch } from "@/shared/ui/address-search";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Card, CardContent } from "@/shared/ui/card";

import { CATEGORY_LABELS } from "@/shared/config/constants";
import type { PostcodeResult } from "@/shared/lib/kakao";
import type { SettingsData } from "../_actions/settings-actions";
import { updateSettings } from "../_actions/settings-actions";

// ─── Props ──────────────────────────────────────────────

interface SettingsFormProps {
  restaurant: SettingsData;
}

// ─── Component ──────────────────────────────────────────

export function SettingsForm({ restaurant }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(restaurant.name);
  const [category, setCategory] = useState(restaurant.category);
  const [imageUrl, setImageUrl] = useState<string | null>(restaurant.imageUrl);
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [notice, setNotice] = useState(restaurant.notice ?? "");
  const [minOrderAmount, setMinOrderAmount] = useState(
    String(restaurant.minOrderAmount)
  );
  const [deliveryFee, setDeliveryFee] = useState(
    String(restaurant.deliveryFee)
  );
  const [deliveryTime, setDeliveryTime] = useState(
    String(restaurant.deliveryTime)
  );
  const [address, setAddress] = useState<string | null>(restaurant.address);
  const [lat, setLat] = useState<number | null>(restaurant.latitude);
  const [lng, setLng] = useState<number | null>(restaurant.longitude);
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [openTime, setOpenTime] = useState(restaurant.openTime ?? "09:00");
  const [closeTime, setCloseTime] = useState(restaurant.closeTime ?? "22:00");

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation
  const isFormValid =
    name.trim().length > 0 && category !== "" && lat !== null && lng !== null;

  // ─── Handlers ───────────────────────────────────────

  function handleAddressSelect(result: PostcodeResult) {
    setAddress(result.roadAddress);
    setLat(result.lat);
    setLng(result.lng);
  }

  function handleNumberInput(
    value: string,
    setter: (v: string) => void
  ) {
    // 숫자만 허용 (빈 문자열도 허용)
    const cleaned = value.replace(/[^0-9]/g, "");
    setter(cleaned);
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSettings({
        name,
        category,
        imageUrl,
        description: description.trim() || null,
        notice: notice.trim() || null,
        minOrderAmount: Number(minOrderAmount) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        deliveryTime: Number(deliveryTime) || 30,
        address,
        latitude: lat!,
        longitude: lng!,
        isOpen,
        openTime: openTime || null,
        closeTime: closeTime || null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();

      // 3초 후 성공 메시지 자동 숨김
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="flex justify-center px-6 py-8">
      <Card className="w-full max-w-[600px] !gap-0 !py-0">
        <CardContent className="!px-6 !py-8 space-y-6">
          {/* 대표 이미지 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">대표 이미지</Label>
            <ImageUpload
              category="restaurant"
              variant="banner"
              defaultImageUrl={imageUrl ?? undefined}
              onUploaded={(_objectKey, publicUrl) => setImageUrl(publicUrl)}
              onRemoved={() => setImageUrl(null)}
            />
          </div>

          {/* 영업 상태 토글 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">영업 상태</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOpen ? "현재 영업 중입니다" : "현재 영업 종료 상태입니다"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isOpen ? "bg-[#2DB400]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  isOpen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 음식점명 */}
          <FormField label="음식점명" required>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="음식점 이름을 입력해주세요"
              maxLength={50}
              className="h-10"
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
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 appearance-none"
            >
              <option value="">카테고리를 선택해주세요</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          {/* 주소 */}
          <FormField label="주소" required>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={address ?? ""}
                  placeholder="주소를 검색해주세요"
                  readOnly
                  className="h-10 pr-9 cursor-default bg-gray-50"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              </div>
              <AddressSearch onSelect={handleAddressSelect}>
                <span className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted transition-colors">
                  검색
                </span>
              </AddressSearch>
            </div>
            {lat !== null && lng !== null && (
              <p className="text-[11px] text-gray-400 mt-1">
                위도: {lat.toFixed(6)}, 경도: {lng.toFixed(6)}
              </p>
            )}
          </FormField>

          {/* 최소 주문금액 + 배달비 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="최소 주문금액" required>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={minOrderAmount}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, setMinOrderAmount)
                  }
                  placeholder="0"
                  className="h-10 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  원
                </span>
              </div>
            </FormField>
            <FormField label="배달비" required>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={deliveryFee}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, setDeliveryFee)
                  }
                  placeholder="0"
                  className="h-10 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  원
                </span>
              </div>
            </FormField>
          </div>

          {/* 예상 배달시간 */}
          <FormField label="예상 배달시간" required>
            <div className="relative max-w-[200px]">
              <Input
                type="text"
                inputMode="numeric"
                value={deliveryTime}
                onChange={(e) =>
                  handleNumberInput(e.target.value, setDeliveryTime)
                }
                placeholder="30"
                className="h-10 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                분
              </span>
            </div>
          </FormField>

          {/* 영업시간 */}
          <FormField label="영업시간">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="h-10 w-[140px]"
              />
              <span className="text-gray-400 text-sm">~</span>
              <Input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="h-10 w-[140px]"
              />
            </div>
          </FormField>

          {/* 소개글 */}
          <FormField label="소개글">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="음식점 소개를 입력해주세요"
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-[11px] text-gray-400 text-right mt-1">
              {description.length}/500
            </p>
          </FormField>

          {/* 공지사항 */}
          <FormField label="공지사항">
            <Textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="고객에게 전달할 공지사항을 입력해주세요"
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-[11px] text-gray-400 text-right mt-1">
              {notice.length}/500
            </p>
          </FormField>

          {/* 피드백 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              <XCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-600 text-sm">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>가게 설정이 저장되었습니다.</span>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !isFormValid}
              className="w-[200px] bg-[#2DB400] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#269900] active:bg-[#1F8000] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  저장 중...
                </span>
              ) : (
                "저장"
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FormField helper ───────────────────────────────────

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
