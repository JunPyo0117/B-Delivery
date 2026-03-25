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
        <h1 className="font-bold text-lg">프로필 수정</h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 flex flex-col gap-6 p-4">
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center gap-2">
          <ImageUpload
            category="profile"
            variant="circle"
            defaultImageUrl={imageUrl ?? undefined}
            onUploaded={(_objectKey, publicUrl) => setImageUrl(publicUrl)}
            onRemoved={() => setImageUrl(null)}
          />
          <span className="text-xs text-muted-foreground">
            프로필 사진 변경
          </span>
        </div>

        {/* 닉네임 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground text-right">
            {nickname.length}/20
          </p>
        </div>

        {/* 기본 배달 주소 */}
        <div className="flex flex-col gap-2">
          <Label>기본 배달 주소</Label>
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

      {/* 저장 버튼 */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !nickname.trim()}
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
