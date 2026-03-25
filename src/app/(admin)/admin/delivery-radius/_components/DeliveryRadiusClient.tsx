"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PolicyManager } from "./PolicyManager";
import { DistrictMapping } from "./DistrictMapping";
import { DensitySimulator } from "./DensitySimulator";
import type { DeliveryPolicy, District } from "@/types/delivery-policy";
import { INITIAL_POLICIES, INITIAL_DISTRICTS } from "../_data/mock";

export function DeliveryRadiusClient() {
  const [policies, setPolicies] = useState<DeliveryPolicy[]>(INITIAL_POLICIES);
  const [districts, setDistricts] = useState<District[]>(INITIAL_DISTRICTS);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">배달 반경 제어</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          배달 반경 티어 정책을 설정하고, 행정구역별로 정책을 매핑합니다.
        </p>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="policies">
        <TabsList className="w-full">
          <TabsTrigger value="policies">티어 정책 관리</TabsTrigger>
          <TabsTrigger value="mapping">행정구역 매핑</TabsTrigger>
          <TabsTrigger value="simulator">밀도 시뮬레이터</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4">
          <PolicyManager policies={policies} onPoliciesChange={setPolicies} />
        </TabsContent>

        <TabsContent value="mapping" className="mt-4">
          <DistrictMapping
            districts={districts}
            policies={policies}
            onDistrictsChange={setDistricts}
          />
        </TabsContent>

        <TabsContent value="simulator" className="mt-4">
          <DensitySimulator districts={districts} policies={policies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
