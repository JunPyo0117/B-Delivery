"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type {
  DeliveryPolicy,
  DeliveryRadiusTier,
} from "@/types/delivery-policy";

interface PolicyManagerProps {
  policies: DeliveryPolicy[];
  onPoliciesChange: (policies: DeliveryPolicy[]) => void;
}

/** 새 빈 정책 생성 */
function createEmptyPolicy(): DeliveryPolicy {
  const id = `policy-${Date.now()}`;
  return {
    id,
    name: "",
    description: "",
    minExposureCount: 5,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tiers: [
      {
        id: `${id}-t1`,
        order: 1,
        label: "1단계",
        radiusKm: 1.0,
        deliveryFee: 0,
      },
    ],
  };
}

/** 새 티어 생성 */
function createTier(policy: DeliveryPolicy): DeliveryRadiusTier {
  const nextOrder = policy.tiers.length + 1;
  const lastTier = policy.tiers[policy.tiers.length - 1];
  return {
    id: `${policy.id}-t${Date.now()}`,
    order: nextOrder,
    label: `${nextOrder}단계`,
    radiusKm: lastTier ? lastTier.radiusKm + 1.0 : 1.0,
    deliveryFee: lastTier ? lastTier.deliveryFee + 1000 : 0,
  };
}

export function PolicyManager({
  policies,
  onPoliciesChange,
}: PolicyManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddPolicy = () => {
    const newPolicy = createEmptyPolicy();
    onPoliciesChange([...policies, newPolicy]);
    setEditingId(newPolicy.id);
  };

  const handleUpdatePolicy = (
    id: string,
    updates: Partial<DeliveryPolicy>
  ) => {
    onPoliciesChange(
      policies.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const handleDeletePolicy = (id: string) => {
    // TODO: DB 연동 시 API 호출로 삭제
    onPoliciesChange(policies.filter((p) => p.id !== id));
  };

  const handleAddTier = (policyId: string) => {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return;
    const newTier = createTier(policy);
    handleUpdatePolicy(policyId, { tiers: [...policy.tiers, newTier] });
  };

  const handleUpdateTier = (
    policyId: string,
    tierId: string,
    updates: Partial<DeliveryRadiusTier>
  ) => {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return;
    handleUpdatePolicy(policyId, {
      tiers: policy.tiers.map((t) =>
        t.id === tierId ? { ...t, ...updates } : t
      ),
    });
  };

  const handleDeleteTier = (policyId: string, tierId: string) => {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy || policy.tiers.length <= 1) return;
    const filtered = policy.tiers
      .filter((t) => t.id !== tierId)
      .map((t, i) => ({ ...t, order: i + 1, label: `${i + 1}단계` }));
    handleUpdatePolicy(policyId, { tiers: filtered });
  };

  // TODO: 저장 시 API 호출 — POST /api/admin/delivery-policies
  const handleSave = () => {
    setEditingId(null);
    alert("정책이 저장되었습니다. (로컬 상태만 반영됨)");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">티어 정책 목록</h2>
        <Button size="sm" onClick={handleAddPolicy}>
          + 정책 추가
        </Button>
      </div>

      {policies.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 정책이 없습니다. 정책을 추가해주세요.
          </CardContent>
        </Card>
      )}

      {policies.map((policy) => {
        const isEditing = editingId === policy.id;
        return (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={policy.name}
                    placeholder="정책 이름"
                    onChange={(e) =>
                      handleUpdatePolicy(policy.id, {
                        name: e.target.value,
                      })
                    }
                    className="max-w-xs"
                  />
                ) : (
                  <CardTitle>{policy.name || "(이름 없음)"}</CardTitle>
                )}
                <Badge variant={policy.isActive ? "default" : "secondary"}>
                  {policy.isActive ? "활성" : "비활성"}
                </Badge>
              </div>
              <CardAction>
                <div className="flex gap-1">
                  {isEditing ? (
                    <Button size="xs" onClick={handleSave}>
                      저장
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setEditingId(policy.id)}
                    >
                      편집
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    삭제
                  </Button>
                </div>
              </CardAction>
              {isEditing ? (
                <Input
                  value={policy.description}
                  placeholder="정책 설명"
                  onChange={(e) =>
                    handleUpdatePolicy(policy.id, {
                      description: e.target.value,
                    })
                  }
                />
              ) : (
                <CardDescription>
                  {policy.description || "설명 없음"}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent>
              {/* 정책 설정 */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${policy.id}`}>활성화</Label>
                  <Switch
                    id={`active-${policy.id}`}
                    checked={policy.isActive}
                    onCheckedChange={(checked) =>
                      handleUpdatePolicy(policy.id, { isActive: checked })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`min-${policy.id}`}>최소 노출 수</Label>
                  <Input
                    id={`min-${policy.id}`}
                    type="number"
                    min={1}
                    value={policy.minExposureCount}
                    onChange={(e) =>
                      handleUpdatePolicy(policy.id, {
                        minExposureCount: Number(e.target.value) || 1,
                      })
                    }
                    disabled={!isEditing}
                    className="w-20"
                  />
                </div>
              </div>

              <Separator />

              {/* 티어 목록 */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    반경 단계
                  </span>
                  {isEditing && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleAddTier(policy.id)}
                    >
                      + 단계 추가
                    </Button>
                  )}
                </div>

                {/* 티어 헤더 */}
                <div className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>순서</span>
                  <span>라벨</span>
                  <span>반경 (km)</span>
                  <span>배달비 (원)</span>
                  <span />
                </div>

                {policy.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="grid grid-cols-[60px_1fr_1fr_1fr_40px] items-center gap-2"
                  >
                    <span className="text-sm text-center">{tier.order}</span>
                    {isEditing ? (
                      <>
                        <Input
                          value={tier.label}
                          onChange={(e) =>
                            handleUpdateTier(policy.id, tier.id, {
                              label: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={tier.radiusKm}
                          onChange={(e) =>
                            handleUpdateTier(policy.id, tier.id, {
                              radiusKm: Number(e.target.value) || 0.1,
                            })
                          }
                        />
                        <Input
                          type="number"
                          step={500}
                          min={0}
                          value={tier.deliveryFee}
                          onChange={(e) =>
                            handleUpdateTier(policy.id, tier.id, {
                              deliveryFee: Number(e.target.value) || 0,
                            })
                          }
                        />
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() =>
                            handleDeleteTier(policy.id, tier.id)
                          }
                          disabled={policy.tiers.length <= 1}
                          title="단계 삭제"
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">{tier.label}</span>
                        <span className="text-sm">{tier.radiusKm} km</span>
                        <span className="text-sm">
                          {tier.deliveryFee.toLocaleString()}원
                        </span>
                        <span />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
