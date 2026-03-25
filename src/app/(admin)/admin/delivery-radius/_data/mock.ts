import type { DeliveryPolicy, District } from "@/types/delivery-policy";

/** 초기 정책 목 데이터 */
export const INITIAL_POLICIES: DeliveryPolicy[] = [
  {
    id: "policy-1",
    name: "기본 정책",
    description: "일반 지역에 적용되는 기본 배달 반경 정책",
    minExposureCount: 5,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    tiers: [
      { id: "t1-1", order: 1, label: "1단계", radiusKm: 1.0, deliveryFee: 0 },
      {
        id: "t1-2",
        order: 2,
        label: "2단계",
        radiusKm: 2.0,
        deliveryFee: 1000,
      },
      {
        id: "t1-3",
        order: 3,
        label: "3단계",
        radiusKm: 3.5,
        deliveryFee: 2000,
      },
    ],
  },
  {
    id: "policy-2",
    name: "밀집 지역 정책",
    description: "음식점이 밀집된 도심 지역용 정책 (좁은 반경)",
    minExposureCount: 10,
    isActive: true,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    tiers: [
      {
        id: "t2-1",
        order: 1,
        label: "1단계",
        radiusKm: 0.5,
        deliveryFee: 0,
      },
      {
        id: "t2-2",
        order: 2,
        label: "2단계",
        radiusKm: 1.0,
        deliveryFee: 1500,
      },
      {
        id: "t2-3",
        order: 3,
        label: "3단계",
        radiusKm: 2.0,
        deliveryFee: 3000,
      },
    ],
  },
];

/** 초기 행정구역 목 데이터 */
export const INITIAL_DISTRICTS: District[] = [
  {
    id: "d-1",
    sido: "서울특별시",
    sigungu: "강남구",
    eupmyeondong: "역삼동",
    policyId: "policy-2",
  },
  {
    id: "d-2",
    sido: "서울특별시",
    sigungu: "강남구",
    eupmyeondong: "삼성동",
    policyId: "policy-2",
  },
  {
    id: "d-3",
    sido: "서울특별시",
    sigungu: "마포구",
    eupmyeondong: "합정동",
    policyId: "policy-1",
  },
  {
    id: "d-4",
    sido: "서울특별시",
    sigungu: "마포구",
    eupmyeondong: "상수동",
    policyId: "policy-1",
  },
  {
    id: "d-5",
    sido: "서울특별시",
    sigungu: "종로구",
    eupmyeondong: "혜화동",
    policyId: null,
  },
  {
    id: "d-6",
    sido: "경기도",
    sigungu: "성남시 분당구",
    eupmyeondong: "정자동",
    policyId: "policy-1",
  },
  {
    id: "d-7",
    sido: "경기도",
    sigungu: "성남시 분당구",
    eupmyeondong: "서현동",
    policyId: null,
  },
  {
    id: "d-8",
    sido: "경기도",
    sigungu: "수원시 영통구",
    eupmyeondong: "광교동",
    policyId: null,
  },
];
