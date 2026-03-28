"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  createMenuWithOptions,
  updateMenuWithOptions,
  type MenuFormData,
  type OptionGroupData,
  type MenuWithOptions,
} from "../actions";
import type { PresignedUrlResponse } from "@/types/upload";

/** 메뉴 카테고리 프리셋 */
const MENU_CATEGORIES = [
  "인기 메뉴",
  "메인 메뉴",
  "사이드",
  "음료",
  "세트 메뉴",
  "기타",
] as const;

// ─── 클라이언트용 옵션 타입 (임시 ID 포함) ──────────

interface ClientOption {
  _key: string; // 클라이언트 렌더링용 고유 키
  id?: string; // DB에 저장된 경우
  name: string;
  extraPrice: number;
  sortOrder: number;
}

interface ClientOptionGroup {
  _key: string;
  id?: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: ClientOption[];
}

// ─── 유틸: 고유 키 생성 ─────────────────────────────

let keyCounter = 0;
function generateKey() {
  return `_temp_${Date.now()}_${++keyCounter}`;
}

// ─── 패널 Props ─────────────────────────────────────

interface MenuSlidePanelProps {
  open: boolean;
  onClose: () => void;
  editMenu: MenuWithOptions | null;
}

export function MenuSlidePanel({
  open,
  onClose,
  editMenu,
}: MenuSlidePanelProps) {
  const isEdit = !!editMenu;

  // 폼 상태
  const [name, setName] = useState("");
  const [category, setCategory] = useState("메인 메뉴");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [optionGroups, setOptionGroups] = useState<ClientOptionGroup[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 편집 메뉴 변경 시 폼 초기화
  useEffect(() => {
    if (open) {
      if (editMenu) {
        setName(editMenu.name);
        setCategory(editMenu.category || "메인 메뉴");
        setPrice(editMenu.price.toString());
        setDescription(editMenu.description ?? "");
        setImageUrl(editMenu.imageUrl ?? "");
        setImagePreview(editMenu.imageUrl ?? "");
        setIsPopular(editMenu.isPopular);
        setIsNew(editMenu.isNew);
        setOptionGroups(
          editMenu.optionGroups.map((g) => ({
            _key: generateKey(),
            id: g.id,
            name: g.name,
            isRequired: g.isRequired,
            maxSelect: g.maxSelect,
            sortOrder: g.sortOrder,
            options: g.options.map((o) => ({
              _key: generateKey(),
              id: o.id,
              name: o.name,
              extraPrice: o.extraPrice,
              sortOrder: o.sortOrder,
            })),
          }))
        );
      } else {
        setName("");
        setCategory("메인 메뉴");
        setPrice("");
        setDescription("");
        setImageUrl("");
        setImagePreview("");
        setIsPopular(false);
        setIsNew(false);
        setOptionGroups([]);
      }
      setError("");
    }
  }, [open, editMenu]);

  // ─── 이미지 업로드 ─────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "menu",
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "업로드 URL 생성 실패");
      }

      const { uploadUrl, publicUrl }: PresignedUrlResponse = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      setImageUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ─── 옵션 그룹 관리 ───────────────────────────────

  const addOptionGroup = useCallback(() => {
    setOptionGroups((prev) => [
      ...prev,
      {
        _key: generateKey(),
        name: "",
        isRequired: false,
        maxSelect: 1,
        sortOrder: prev.length,
        options: [
          {
            _key: generateKey(),
            name: "",
            extraPrice: 0,
            sortOrder: 0,
          },
        ],
      },
    ]);
  }, []);

  const removeOptionGroup = useCallback((groupKey: string) => {
    setOptionGroups((prev) => prev.filter((g) => g._key !== groupKey));
  }, []);

  const updateOptionGroup = useCallback(
    (groupKey: string, field: string, value: string | boolean | number) => {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g._key === groupKey ? { ...g, [field]: value } : g
        )
      );
    },
    []
  );

  const addOption = useCallback((groupKey: string) => {
    setOptionGroups((prev) =>
      prev.map((g) =>
        g._key === groupKey
          ? {
              ...g,
              options: [
                ...g.options,
                {
                  _key: generateKey(),
                  name: "",
                  extraPrice: 0,
                  sortOrder: g.options.length,
                },
              ],
            }
          : g
      )
    );
  }, []);

  const removeOption = useCallback((groupKey: string, optionKey: string) => {
    setOptionGroups((prev) =>
      prev.map((g) =>
        g._key === groupKey
          ? {
              ...g,
              options: g.options.filter((o) => o._key !== optionKey),
            }
          : g
      )
    );
  }, []);

  const updateOption = useCallback(
    (
      groupKey: string,
      optionKey: string,
      field: string,
      value: string | number
    ) => {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g._key === groupKey
            ? {
                ...g,
                options: g.options.map((o) =>
                  o._key === optionKey ? { ...o, [field]: value } : o
                ),
              }
            : g
        )
      );
    },
    []
  );

  // ─── 제출 ─────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedPrice = parseInt(price, 10);
    if (!name.trim()) {
      setError("메뉴 이름을 입력해주세요.");
      return;
    }
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("올바른 가격을 입력해주세요.");
      return;
    }

    // 옵션 그룹 유효성 검사
    for (const group of optionGroups) {
      if (!group.name.trim()) {
        setError("옵션 그룹 이름을 입력해주세요.");
        return;
      }
      for (const opt of group.options) {
        if (!opt.name.trim()) {
          setError(`"${group.name}" 그룹의 옵션 이름을 입력해주세요.`);
          return;
        }
      }
    }

    const formData: MenuFormData = {
      name: name.trim(),
      category,
      price: parsedPrice,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      isPopular,
      isNew,
    };

    const groupsData: OptionGroupData[] = optionGroups.map((g, gi) => ({
      id: g.id,
      name: g.name.trim(),
      isRequired: g.isRequired,
      maxSelect: g.maxSelect,
      sortOrder: gi,
      options: g.options.map((o, oi) => ({
        id: o.id,
        name: o.name.trim(),
        extraPrice: o.extraPrice,
        sortOrder: oi,
      })),
    }));

    startTransition(async () => {
      const result = isEdit
        ? await updateMenuWithOptions(editMenu!.id, formData, groupsData)
        : await createMenuWithOptions(formData, groupsData);

      if (result.error) {
        setError(result.error);
        return;
      }

      onClose();
    });
  }

  return (
    <>
      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 슬라이드 패널 */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "메뉴 수정" : "메뉴 등록"}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending || uploading}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 패널 바디 (스크롤) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* 이미지 업로드 */}
            <div className="space-y-2">
              <Label>메뉴 이미지</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
                    <Image
                      src={imagePreview}
                      alt="메뉴 미리보기"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-[#2DB400] hover:text-[#2DB400]"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">이미지</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/webp,image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* 메뉴명 */}
            <div className="space-y-2">
              <Label htmlFor="panel-menu-name">
                메뉴명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="panel-menu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 양념치킨"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label>
                카테고리 <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      category === cat
                        ? "border-[#2DB400] bg-[#2DB400] text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-[#2DB400] hover:text-[#2DB400]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 가격 */}
            <div className="space-y-2">
              <Label htmlFor="panel-menu-price">
                가격 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="panel-menu-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="예: 18000"
                  min={0}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  원
                </span>
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="panel-menu-desc">설명</Label>
              <Textarea
                id="panel-menu-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="메뉴 설명을 입력하세요"
                rows={3}
              />
            </div>

            {/* 뱃지 설정 */}
            <div className="space-y-2">
              <Label>뱃지</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isNew}
                    onCheckedChange={(checked) => setIsNew(checked)}
                  />
                  NEW
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isPopular}
                    onCheckedChange={(checked) => setIsPopular(checked)}
                  />
                  인기
                </label>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">옵션 그룹</Label>
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="flex items-center gap-1 text-sm font-medium text-[#2DB400] hover:text-[#249a00]"
                >
                  <Plus className="h-4 w-4" />
                  옵션 그룹 추가
                </button>
              </div>
            </div>

            {/* 옵션 그룹 목록 */}
            {optionGroups.map((group) => (
              <OptionGroupEditor
                key={group._key}
                group={group}
                onRemove={() => removeOptionGroup(group._key)}
                onUpdateGroup={(field, value) =>
                  updateOptionGroup(group._key, field, value)
                }
                onAddOption={() => addOption(group._key)}
                onRemoveOption={(optKey) => removeOption(group._key, optKey)}
                onUpdateOption={(optKey, field, value) =>
                  updateOption(group._key, optKey, field, value)
                }
              />
            ))}

            {optionGroups.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-2">
                등록된 옵션 그룹이 없습니다
              </p>
            )}
          </div>

          {/* 에러 + 저장 버튼 */}
          <div className="border-t px-6 py-4">
            {error && (
              <p className="mb-3 text-sm font-medium text-red-500">{error}</p>
            )}
            <Button
              type="submit"
              disabled={isPending || uploading}
              className="w-full bg-[#2DB400] text-white hover:bg-[#249a00]"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : isEdit ? (
                "수정"
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── 옵션 그룹 에디터 ───────────────────────────────

interface OptionGroupEditorProps {
  group: ClientOptionGroup;
  onRemove: () => void;
  onUpdateGroup: (field: string, value: string | boolean | number) => void;
  onAddOption: () => void;
  onRemoveOption: (optionKey: string) => void;
  onUpdateOption: (
    optionKey: string,
    field: string,
    value: string | number
  ) => void;
}

function OptionGroupEditor({
  group,
  onRemove,
  onUpdateGroup,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: OptionGroupEditorProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* 그룹 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <Input
            value={group.name}
            onChange={(e) => onUpdateGroup("name", e.target.value)}
            placeholder="옵션 그룹명 (예: 사이즈 선택)"
            className="bg-white"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox
                checked={group.isRequired}
                onCheckedChange={(checked) =>
                  onUpdateGroup("isRequired", checked)
                }
              />
              필수 선택
            </label>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>최대</span>
              <Input
                type="number"
                value={group.maxSelect}
                onChange={(e) =>
                  onUpdateGroup("maxSelect", parseInt(e.target.value, 10) || 1)
                }
                min={1}
                className="h-7 w-14 bg-white text-center"
              />
              <span>개</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="그룹 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 옵션 목록 */}
      <div className="mt-3 space-y-2">
        {group.options.map((option) => (
          <div
            key={option._key}
            className="flex items-center gap-2"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
            <Input
              value={option.name}
              onChange={(e) =>
                onUpdateOption(option._key, "name", e.target.value)
              }
              placeholder="옵션명"
              className="flex-1 bg-white"
            />
            <div className="relative w-28 shrink-0">
              <Input
                type="number"
                value={option.extraPrice}
                onChange={(e) =>
                  onUpdateOption(
                    option._key,
                    "extraPrice",
                    parseInt(e.target.value, 10) || 0
                  )
                }
                placeholder="추가 금액"
                className="bg-white pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                원
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveOption(option._key)}
              className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="옵션 삭제"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 옵션 추가 버튼 */}
      <button
        type="button"
        onClick={onAddOption}
        className="mt-2 flex items-center gap-1 text-sm font-medium text-[#2DB400] hover:text-[#249a00]"
      >
        <Plus className="h-3.5 w-3.5" />
        옵션 추가
      </button>
    </div>
  );
}
