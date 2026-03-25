"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { DeliveryPolicy, District } from "@/types/delivery-policy";

interface DistrictMappingProps {
  districts: District[];
  policies: DeliveryPolicy[];
  onDistrictsChange: (districts: District[]) => void;
}

export function DistrictMapping({
  districts,
  policies,
  onDistrictsChange,
}: DistrictMappingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSido, setFilterSido] = useState<string | "all">("all");

  /** 시/도 목록 추출 */
  const sidoList = useMemo(() => {
    const set = new Set(districts.map((d) => d.sido));
    return Array.from(set).sort();
  }, [districts]);

  /** 필터된 행정구역 */
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchesSido = filterSido === "all" || d.sido === filterSido;
      const matchesSearch =
        !searchQuery ||
        `${d.sido} ${d.sigungu} ${d.eupmyeondong}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSido && matchesSearch;
    });
  }, [districts, filterSido, searchQuery]);

  /** 정책 이름 가져오기 */
  const getPolicyName = (policyId: string | null) => {
    if (!policyId) return null;
    return policies.find((p) => p.id === policyId)?.name ?? "(삭제된 정책)";
  };

  /** 행정구역 정책 매핑 변경 */
  const handlePolicyChange = (districtId: string, policyId: string) => {
    // TODO: DB 연동 시 API 호출 — PUT /api/admin/districts/:id/policy
    onDistrictsChange(
      districts.map((d) =>
        d.id === districtId
          ? { ...d, policyId: policyId === "" ? null : policyId }
          : d
      )
    );
  };

  /** 시/군/구별 그룹핑 */
  const grouped = useMemo(() => {
    const map = new Map<string, District[]>();
    for (const d of filteredDistricts) {
      const key = `${d.sido} ${d.sigungu}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [filteredDistricts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">행정구역별 정책 매핑</h2>
      </div>

      {/* 검색/필터 */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="행정구역 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1 flex-wrap">
          <Button
            size="xs"
            variant={filterSido === "all" ? "default" : "outline"}
            onClick={() => setFilterSido("all")}
          >
            전체
          </Button>
          {sidoList.map((sido) => (
            <Button
              key={sido}
              size="xs"
              variant={filterSido === sido ? "default" : "outline"}
              onClick={() => setFilterSido(sido)}
            >
              {sido}
            </Button>
          ))}
        </div>
      </div>

      {/* 그룹별 카드 */}
      {Array.from(grouped.entries()).map(([groupKey, groupDistricts]) => (
        <Card key={groupKey}>
          <CardHeader>
            <CardTitle className="text-base">{groupKey}</CardTitle>
            <CardDescription>
              {groupDistricts.length}개 동 | 미매핑:{" "}
              {groupDistricts.filter((d) => !d.policyId).length}개
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupDistricts.map((district) => {
                const policyName = getPolicyName(district.policyId);
                return (
                  <div
                    key={district.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {district.eupmyeondong}
                      </span>
                      {policyName ? (
                        <Badge variant="secondary">{policyName}</Badge>
                      ) : (
                        <Badge variant="outline">미매핑</Badge>
                      )}
                    </div>
                    <select
                      value={district.policyId ?? ""}
                      onChange={(e) =>
                        handlePolicyChange(district.id, e.target.value)
                      }
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    >
                      <option value="">정책 없음</option>
                      {policies.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || "(이름 없음)"}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredDistricts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            검색 조건에 맞는 행정구역이 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
