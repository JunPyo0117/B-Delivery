export interface ReviewCardData {
  id: string
  rating: number
  content: string | null
  tags: string[]
  imageUrls: string[]
  ownerReply: string | null
  ownerRepliedAt: Date | null
  userName: string
  userImage: string | null
  createdAt: Date
}

export interface ReviewFormData {
  orderId: string
  restaurantId: string
  rating: number
  content?: string
  tags: string[]
  imageUrls: string[]
}

export const REVIEW_TAGS = [
  "맛이 좋아요",
  "양이 많아요",
  "배달이 빨라요",
  "포장이 꼼꼼해요",
  "재주문 의사 있어요",
] as const

export type ReviewTag = (typeof REVIEW_TAGS)[number]

export interface ReviewStats {
  averageRating: number
  totalCount: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface ReviewListResult {
  reviews: ReviewCardData[]
  stats: ReviewStats
  nextCursor: string | null
}
