/** 배달 반경 티어 (단계별 반경 설정) */
export interface DeliveryRadiusTier {
  id: string;
  /** 티어 순서 (1부터 시작) */
  order: number;
  /** 티어 라벨 (예: "1단계", "2단계") */
  label: string;
  /** 반경 (km) */
  radiusKm: number;
  /** 배달비 (원) */
  deliveryFee: number;
}

/** 배달 반경 정책 */
export interface DeliveryPolicy {
  id: string;
  /** 정책 이름 (예: "기본 정책", "밀집 지역 정책") */
  name: string;
  /** 정책 설명 */
  description: string;
  /** 최소 노출 음식점 수 — 이 수 이하이면 반경 자동 확장 */
  minExposureCount: number;
  /** 반경 티어 목록 */
  tiers: DeliveryRadiusTier[];
  /** 활성 여부 */
  isActive: boolean;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/** 행정구역 */
export interface District {
  id: string;
  /** 시/도 */
  sido: string;
  /** 시/군/구 */
  sigungu: string;
  /** 읍/면/동 */
  eupmyeondong: string;
  /** 매핑된 정책 ID (null이면 기본 정책 적용) */
  policyId: string | null;
}

/** 밀도 시뮬레이션 결과 */
export interface DensitySimulationResult {
  /** 시뮬레이션 대상 행정구역 */
  district: District;
  /** 적용 정책 */
  policy: DeliveryPolicy;
  /** 티어별 노출 음식점 수 */
  tierResults: {
    tier: DeliveryRadiusTier;
    restaurantCount: number;
  }[];
  /** 총 노출 음식점 수 */
  totalExposure: number;
  /** 최소 노출 수 충족 여부 */
  meetsMinimum: boolean;
}
