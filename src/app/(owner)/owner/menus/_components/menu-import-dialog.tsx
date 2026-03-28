"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Download, Search, Loader2, Check } from "lucide-react";
import {
  getMenuTemplates,
  applyMenuTemplate,
  searchRestaurantsForCopy,
  copyMenusFromRestaurant,
} from "../actions";

const CATEGORY_LABELS: Record<string, string> = {
  CHICKEN: "치킨",
  KOREAN: "한식",
  CHINESE: "중식",
  PIZZA: "피자",
  BUNSIK: "분식",
  JAPANESE: "일식",
};

export function MenuImportDialog() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"template" | "copy">("template");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  // 템플릿 탭
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const templates = getMenuTemplates();

  // 복사 탭
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; category: string; _count: { menus: number } }[]
  >([]);

  const handleApplyTemplate = (category: string) => {
    startTransition(async () => {
      const res = await applyMenuTemplate(category);
      if (res.success) {
        setResult(`${res.count}개 메뉴가 추가되었습니다. 가격을 입력해주세요!`);
        setTimeout(() => { setOpen(false); setResult(null); }, 2000);
      } else {
        setResult(res.error || "오류가 발생했습니다.");
      }
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    startTransition(async () => {
      const res = await searchRestaurantsForCopy(searchQuery);
      if (res.restaurants) setSearchResults(res.restaurants);
    });
  };

  const handleCopy = (restaurantId: string) => {
    startTransition(async () => {
      const res = await copyMenusFromRestaurant(restaurantId);
      if (res.success) {
        setResult(`${res.count}개 메뉴가 복사되었습니다. 가격을 설정해주세요!`);
        setTimeout(() => { setOpen(false); setResult(null); }, 2000);
      } else {
        setResult(res.error || "오류가 발생했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          메뉴 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>메뉴 가져오기</DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex gap-2 border-b pb-2">
          <button
            onClick={() => setTab("template")}
            className={`px-3 py-1.5 text-sm rounded-md ${tab === "template" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            카테고리 템플릿
          </button>
          <button
            onClick={() => setTab("copy")}
            className={`px-3 py-1.5 text-sm rounded-md ${tab === "copy" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            다른 가게에서 복사
          </button>
        </div>

        {result && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            <Check className="h-4 w-4" /> {result}
          </div>
        )}

        {/* 카테고리 템플릿 탭 */}
        {tab === "template" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              카테고리별 대표 메뉴를 자동으로 추가합니다. 가격은 0원으로 설정되며, 추가 후 수정해주세요.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(templates).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    selectedCategory === cat ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{CATEGORY_LABELS[cat] || cat}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{templates[cat].length}개 메뉴</div>
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium">미리보기</div>
                <div className="space-y-1">
                  {templates[selectedCategory].map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{m.name}</span>
                      <div className="flex gap-1">
                        {m.options?.map((o, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{o.groupName}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleApplyTemplate(selectedCategory)}
                  disabled={isPending}
                  className="w-full mt-2"
                  size="sm"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {templates[selectedCategory].length}개 메뉴 추가하기
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 다른 가게 복사 탭 */}
        {tab === "copy" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              같은 이름의 프랜차이즈나 다른 가게의 메뉴 구조를 복사합니다. 가격은 0원으로 초기화됩니다.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="가게 이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isPending} size="sm" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {searchResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-gray-400">메뉴 {r._count.menus}개</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(r.id)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "복사"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !isPending && (
              <p className="text-sm text-gray-400 text-center py-4">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
