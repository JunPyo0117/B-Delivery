"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { Camera, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/entities/review"
import { createReview, REVIEW_TAGS } from "@/entities/review"
import type { ReviewFormData } from "@/entities/review"
import { cn } from "@/shared/lib"

interface ReviewFormProps {
  userId: string
  orderId: string
  restaurantId: string
  onSuccess?: (reviewId: string) => void
  onCancel?: () => void
  className?: string
}

const MAX_IMAGES = 3

/**
 * 리뷰 작성 폼
 * - 별점(StarRating 입력 모드), 텍스트, 태그 칩, 이미지(최대 3장)
 * - 이미지: /api/upload/presigned-url 통해 MinIO 업로드
 * - 제출 -> entities/review/api/createReview
 */
export function ReviewForm({
  userId,
  orderId,
  restaurantId,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_IMAGES - imageUrls.length
    if (remaining <= 0) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        // 1. Presigned URL 획득
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
          const data = await presignedRes.json()
          throw new Error(data.error ?? "이미지 업로드 URL 생성 실패")
        }

        const { uploadUrl, publicUrl } = await presignedRes.json()

        // 2. MinIO에 직접 업로드
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!uploadRes.ok) {
          throw new Error("이미지 업로드에 실패했습니다.")
        }

        uploadedUrls.push(publicUrl)
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패")
    } finally {
      setUploading(false)
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (rating === 0) {
      setError("별점을 선택해주세요.")
      return
    }

    setError(null)

    const formData: ReviewFormData = {
      orderId,
      restaurantId,
      rating,
      content: content.trim() || undefined,
      tags: selectedTags,
      imageUrls,
    }

    startTransition(async () => {
      const result = await createReview(userId, formData)
      if (result.success && result.reviewId) {
        onSuccess?.(result.reviewId)
      } else {
        setError(result.error ?? "리뷰 작성에 실패했습니다.")
      }
    })
  }

  return (
    <div className={cn("space-y-5", className)}>
      {/* 별점 */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          음식은 어떠셨나요?
        </p>
        <StarRating
          value={rating}
          onChange={setRating}
          readOnly={false}
          size="lg"
        />
        {rating > 0 && (
          <span className="text-sm text-gray-500">{rating}점</span>
        )}
      </div>

      {/* 태그 칩 */}
      <div className="flex flex-wrap gap-2">
        {REVIEW_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              selectedTags.includes(tag)
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 텍스트 입력 */}
      <Textarea
        placeholder="리뷰를 작성해주세요 (선택)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={500}
      />

      {/* 이미지 업로드 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/jpeg,image/png,image/gif"
            multiple
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading || imageUrls.length >= MAX_IMAGES}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || imageUrls.length >= MAX_IMAGES}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Camera className="mr-1.5 size-4" />
            )}
            사진 첨부 ({imageUrls.length}/{MAX_IMAGES})
          </Button>
        </div>

        {/* 미리보기 */}
        {imageUrls.length > 0 && (
          <div className="flex gap-2">
            {imageUrls.map((url, index) => (
              <div
                key={index}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
              >
                <Image
                  src={url}
                  alt={`리뷰 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 제출 버튼 */}
      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isPending}
          >
            취소
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
        >
          {isPending ? "등록 중..." : "리뷰 등록"}
        </Button>
      </div>
    </div>
  )
}
