"use client";

import { useState, useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type {
  DeliveryPolicy,
  District,
  DensitySimulationResult,
} from "@/types/delivery-policy";

interface DensitySimulatorProps {
  districts: District[];
  policies: DeliveryPolicy[];
}

/**
 * 시뮬레이션 실행 (목 데이터 기반)
 * TODO: 실제 구현 시 API 호출 — GET /api/admin/simulate?districtId=...
 *   서버에서 해당 구역 중심 좌표 기준으로 반경별 음식점 수를 계산
 */
function runSimulation(
  district: District,
  policy: DeliveryPolicy
): DensitySimulationResult {
  // 목 시뮬레이션: 랜덤 값 기반으로 결과 생성
  const seed = district.id.charCodeAt(district.id.length - 1);
  const tierResults = policy.tiers.map((tier) => {
    // 반경이 클수록 더 많은 음식점이 노출
    const base = Math.floor((seed * 3 + tier.order * 7) % 15) + 1;
    const count = Math.floor(base * tier.radiusKm);
    return { tier, restaurantCount: count };
  });

  const totalExposure = tierResults.reduce(
    (sum, r) => sum + r.restaurantCount,
    0
  );

  return {
    district,
    policy,
    tierResults,
    totalExposure,
    meetsMinimum: totalExposure >= policy.minExposureCount,
  };
}

export function DensitySimulator({
  districts,
  policies,
}: DensitySimulatorProps) {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );
  const [result, setResult] = useState<DensitySimulationResult | null>(null);

  /** 매핑된 행정구역만 시뮬레이션 가능 */
  const mappedDistricts = useMemo(
    () => districts.filter((d) => d.policyId !== null),
    [districts]
  );

  const handleSimulate = () => {
    if (!selectedDistrictId) return;
    const district = districts.find((d) => d.id === selectedDistrictId);
    if (!district || !district.policyId) return;
    const policy = policies.find((p) => p.id === district.policyId);
    if (!policy) return;
    setResult(runSimulation(district, policy));
  };

  /** 전체 시뮬레이션 */
  const [batchResults, setBatchResults] = useState<
    DensitySimulationResult[] | null
  >(null);

  const handleBatchSimulate = () => {
    const results = mappedDistricts
      .map((district) => {
        const policy = policies.find((p) => p.id === district.policyId);
        if (!policy) return null;
        return runSimulation(district, policy);
      })
      .filter(Boolean) as DensitySimulationResult[];
    setBatchResults(results);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">밀도 시뮬레이터</h2>
        <Button size="sm" variant="outline" onClick={handleBatchSimulate}>
          전체 시뮬레이션
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        행정구역을 선택하면 해당 지역의 정책 기반 노출 건수를 미리보기합니다.
      </p>

      {/* 행정구역 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">행정구역 선택</CardTitle>
          <CardDescription>
            정책이 매핑된 행정구역만 시뮬레이션할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <select
                value={selectedDistrictId ?? ""}
                onChange={(e) => setSelectedDistrictId(e.target.value || null)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="">행정구역 선택...</option>
                {mappedDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.sido} {d.sigungu} {d.eupmyeondong}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={handleSimulate}
              disabled={!selectedDistrictId}
            >
              시뮬레이션 실행
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 단건 결과 */}
      {result && <SimulationResultCard result={result} />}

      {/* 일괄 결과 */}
      {batchResults && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">전체 시뮬레이션 결과</h3>

          {/* 요약 */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="총 행정구역"
              value={`${batchResults.length}개`}
            />
            <SummaryCard
              label="기준 충족"
              value={`${batchResults.filter((r) => r.meetsMinimum).length}개`}
              variant="success"
            />
            <SummaryCard
              label="기준 미달"
              value={`${batchResults.filter((r) => !r.meetsMinimum).length}개`}
              variant="warning"
            />
          </div>

          {/* 상세 리스트 */}
          {batchResults.map((r) => (
            <SimulationResultCard key={r.district.id} result={r} compact />
          ))}
        </div>
      )}
    </div>
  );
}

/** 시뮬레이션 결과 카드 */
function SimulationResultCard({
  result,
  compact = false,
}: {
  result: DensitySimulationResult;
  compact?: boolean;
}) {
  const { district, policy, tierResults, totalExposure, meetsMinimum } = result;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            {district.sido} {district.sigungu} {district.eupmyeondong}
          </CardTitle>
          <Badge variant={meetsMinimum ? "default" : "destructive"}>
            {meetsMinimum ? "충족" : "미달"}
          </Badge>
        </div>
        <CardDescription>
          적용 정책: {policy.name} | 최소 노출: {policy.minExposureCount}개
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 티어별 결과 바 */}
        <div className="space-y-2">
          {tierResults.map(({ tier, restaurantCount }) => {
            const maxCount = Math.max(
              ...tierResults.map((r) => r.restaurantCount),
              1
            );
            const pct = (restaurantCount / maxCount) * 100;
            return (
              <div key={tier.id} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {tier.label} ({tier.radiusKm}km,{" "}
                    {tier.deliveryFee.toLocaleString()}원)
                  </span>
                  <span className="font-medium text-foreground">
                    {restaurantCount}개
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      meetsMinimum ? "bg-primary" : "bg-destructive"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-3" />

        <div className="flex justify-between text-sm">
          <span className="font-medium">총 노출 음식점</span>
          <span className="font-bold">{totalExposure}개</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** 요약 카드 */
function SummaryCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "success" | "warning";
}) {
  const borderColor = {
    default: "border-border",
    success: "border-green-300",
    warning: "border-orange-300",
  }[variant];

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} bg-card p-3 text-center`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
