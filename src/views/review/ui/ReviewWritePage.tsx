"use client"

import React, { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Star, Camera, Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { PresignedUrlResponse } from "@/types/upload"

/** 리뷰 태그 목록 */
const REVIEW_TAGS = [
  "맛이 좋아요",
  "양이 많아요",
  "배달이 빨라요",
  "포장이 깔끔해요",
  "가성비가 좋아요",
  "재주문 의사 있어요",
] as const

interface OrderInfo {
  orderId: string
  restaurantName: string
  restaurantId: string
  menuSummary: string
}

interface ReviewWritePageProps {
  order: OrderInfo
  createReview: (input: {
    orderId: string
    rating: number
    content?: string
    tags: string[]
    imageUrls: string[]
  }) => Promise<{ success: boolean; error?: string; reviewId?: string }>
}

/**
 * 리뷰 작성 페이지 (FSD pages 레이어)
 * - 별점 (1~5)
 * - 태그 칩 선택
 * - 텍스트 리뷰 (선택)
 * - 이미지 업로드 (최대 3장)
 * - 완료 시 음식점 페이지로 이동
 */
export function ReviewWritePage({ order, createReview }: ReviewWritePageProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (rating === 0) {
      setError("별점을 선택해주세요.")
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await createReview({
        orderId: order.orderId,
        rating,
        content: content.trim() || undefined,
        tags: selectedTags,
        imageUrls,
      })

      if (result.success) {
        router.push(`/restaurants/${order.restaurantId}`)
        router.refresh()
      } else {
        setError(result.error || "리뷰 작성에 실패했습니다.")
      }
    })
  }

  const ratingLabels = ["", "별로예요", "그저 그래요", "보통이에요", "맛있어요", "최고예요"]

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1"
          aria-label="닫기"
        >
          <X className="size-5 text-gray-900" />
        </button>
        <h1 className="text-[16px] font-bold text-gray-900">리뷰 작성</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="text-[14px] font-bold disabled:text-gray-300 transition-colors"
          style={rating > 0 && !isPending ? { color: "#2DB400" } : {}}
        >
          {isPending ? "등록중..." : "등록"}
        </button>
      </header>

      <div className="flex-1">
        {/* 가게 정보 바 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <p className="text-[14px] font-bold text-gray-900">{order.restaurantName}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">{order.menuSummary}</p>
        </div>

        {/* 별점 */}
        <div className="flex flex-col items-center py-8 px-4">
          <p className="text-[15px] font-semibold text-gray-900 mb-4">
            음식은 어떠셨나요?
          </p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1
              const filled = starValue <= rating

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(starValue)}
                  className="transition-transform hover:scale-110 active:scale-95 p-0.5"
                  aria-label={`${starValue}점`}
                >
                  <Star
                    className="size-9 transition-colors"
                    style={
                      filled
                        ? { fill: "#FFB300", color: "#FFB300" }
                        : { fill: "#e5e7eb", color: "#d1d5db" }
                    }
                  />
                </button>
              )
            })}
          </div>
          {rating > 0 && (
            <p
              className="text-[14px] font-bold mt-3"
              style={{ color: "#FFB300" }}
            >
              {ratingLabels[rating]}
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* 태그 선택 */}
        <div className="px-4 py-5">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">
            이 음식점의 장점을 알려주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                    isSelected
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={isSelected ? { backgroundColor: "#2DB400" } : {}}
                >
                  {isSelected && "✓ "}
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* 텍스트 리뷰 */}
        <div className="px-4 py-5">
          <textarea
            placeholder="다른 고객들에게 도움이 되는 리뷰를 남겨주세요 (선택)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
          />
          <p className="mt-1.5 text-right text-[11px] text-gray-400">
            {content.length}/500
          </p>
        </div>

        {/* 이미지 업로드 */}
        <div className="px-4 pb-8">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">
            사진 첨부 (선택)
          </p>
          <ReviewImageUploader
            imageUrls={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={3}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 mb-4 rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#FF52521a", color: "#FF5252" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

/** 이미지 업로더 (인라인) */
function ReviewImageUploader({
  imageUrls,
  onImagesChange,
  maxImages = 3,
}: {
  imageUrls: string[]
  onImagesChange: (urls: string[]) => void
  maxImages?: number
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - imageUrls.length
    if (remainingSlots <= 0) {
      setError(`이미지는 최대 ${maxImages}장까지 업로드 가능합니다.`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setUploading(true)
    setError(null)

    try {
      const newUrls: string[] = []

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          setError("파일 크기는 5MB 이하여야 합니다.")
          continue
        }

        const presignedRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "review",
            contentType: file.type,
            fileSize: file.size,
          }),
        })

        if (!presignedRes.ok) {
          const errData = await presignedRes.json()
          throw new Error(errData.error || "업로드 URL 생성 실패")
        }

        const { uploadUrl, publicUrl }: PresignedUrlResponse =
          await presignedRes.json()

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!uploadRes.ok) {
          throw new Error("이미지 업로드에 실패했습니다.")
        }

        newUrls.push(publicUrl)
      }

      onImagesChange([...imageUrls, ...newUrls])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      )
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index)
    onImagesChange(newUrls)
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className="relative size-20 shrink-0 overflow-hidden rounded-lg border"
          >
            <img
              src={url}
              alt={`리뷰 이미지 ${index + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="이미지 삭제"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {imageUrls.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Camera className="size-5" />
                <span className="text-xs">
                  {imageUrls.length}/{maxImages}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

