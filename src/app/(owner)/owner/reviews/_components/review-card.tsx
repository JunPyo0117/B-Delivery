"use client";

import { useState, useTransition } from "react";
import { Star, Store, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import type { OwnerReviewItem } from "../_actions/review-actions";
import {
  createOwnerReply,
  updateOwnerReply,
  deleteOwnerReply,
} from "../_actions/review-actions";

// ── 헬퍼 ───────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-[#FFB300] text-[#FFB300]"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────

interface ReviewCardProps {
  review: OwnerReviewItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState(review.ownerReply ?? "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const initial = review.user.nickname?.charAt(0) ?? "?";

  // 답글 저장 (신규 작성 / 수정)
  function handleSaveReply() {
    if (!replyContent.trim()) return;

    startTransition(async () => {
      const action = isEditing ? updateOwnerReply : createOwnerReply;
      const result = await action(review.id, replyContent);

      if (result.error) {
        alert(result.error);
        return;
      }

      setIsReplying(false);
      setIsEditing(false);
    });
  }

  // 답글 삭제
  function handleDeleteReply() {
    startTransition(async () => {
      const result = await deleteOwnerReply(review.id);

      if (result.error) {
        alert(result.error);
        return;
      }

      setDeleteDialogOpen(false);
      setReplyContent("");
    });
  }

  // 취소
  function handleCancel() {
    setIsReplying(false);
    setIsEditing(false);
    setReplyContent(review.ownerReply ?? "");
  }

  // 수정 모드 진입
  function handleStartEdit() {
    setReplyContent(review.ownerReply ?? "");
    setIsEditing(true);
    setIsReplying(true);
  }

  // 신규 답글 작성 모드 진입
  function handleStartReply() {
    setReplyContent("");
    setIsEditing(false);
    setIsReplying(true);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* 상단: 유저 정보 + 별점 + 날짜 */}
      <div className="flex items-center gap-3">
        <Avatar className="size-9 border border-gray-100">
          <AvatarImage src={review.user.image ?? undefined} />
          <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-500">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">
              {review.user.nickname}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
          <div className="mt-0.5">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </div>

      {/* 주문 메뉴 태그 */}
      {review.orderMenuNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.orderMenuNames.map((name, i) => (
            <span
              key={i}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 태그 */}
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#2DB400]/10 px-2.5 py-0.5 text-xs font-medium text-[#2DB400]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 리뷰 본문 */}
      {review.content && (
        <p className="mt-3 text-sm leading-relaxed text-gray-800">
          {review.content}
        </p>
      )}

      {/* 첨부 이미지 */}
      {review.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`리뷰 이미지 ${i + 1}`}
              className="size-20 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* 구분선 */}
      <div className="my-4 border-t border-gray-100" />

      {/* 사장님 답글 영역 */}
      {review.ownerReply && !isReplying ? (
        /* 답글이 존재하고 편집 모드가 아닐 때 */
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Store className="size-4 text-[#2DB400]" />
            사장님 답글
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {review.ownerReply}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              disabled={isPending}
            >
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              삭제
            </Button>
          </div>
        </div>
      ) : isReplying ? (
        /* 답글 작성/수정 폼 */
        <div className="rounded-lg border border-[#2DB400]/30 bg-green-50/50 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Store className="size-4 text-[#2DB400]" />
            {isEditing ? "답글 수정" : "답글 작성"}
          </div>
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="고객에게 답글을 작성해주세요..."
            className="min-h-[80px] resize-none border-gray-200 bg-white text-sm"
            disabled={isPending}
          />
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              className="bg-[#2DB400] text-white hover:bg-[#249900]"
              onClick={handleSaveReply}
              disabled={isPending || !replyContent.trim()}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "저장"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        /* 답글이 없을 때: 답글 작성 버튼 */
        <Button
          variant="outline"
          size="sm"
          className="border-[#2DB400]/40 text-[#2DB400] hover:bg-[#2DB400]/5"
          onClick={handleStartReply}
        >
          <Store className="size-4" />
          답글 작성
        </Button>
      )}

      {/* 답글 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>답글 삭제</DialogTitle>
            <DialogDescription>
              작성한 답글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteReply}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
