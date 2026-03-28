/** 리뷰 태그 목록 */
export const REVIEW_TAGS = [
  "맛이 좋아요",
  "양이 많아요",
  "배달이 빨라요",
  "포장이 깔끔해요",
  "가성비가 좋아요",
  "재주문 의사 있어요",
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];
