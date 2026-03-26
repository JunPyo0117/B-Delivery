"use client";

import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { AddressCard } from "./address-card";

interface Address {
  id: string;
  label: string;
  address: string;
  addressDetail: string | null;
  isDefault: boolean;
}

interface AddressListProps {
  addresses: Address[];
}

export function AddressList({ addresses }: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center">
          <MapPin className="size-7 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-medium text-gray-900">
            등록된 주소가 없습니다
          </p>
          <p className="text-[13px] text-gray-500 mt-1">
            배달 받을 주소를 추가해주세요
          </p>
        </div>
        <Link
          href="/mypage/addresses/new"
          className="inline-flex items-center gap-1.5 bg-[#2DB400] text-white rounded-full px-6 py-2.5 text-[14px] font-semibold hover:bg-[#269900] active:bg-[#1F8000] transition-colors"
        >
          <Plus className="size-4" />
          주소 추가
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* 주소 카드 목록 */}
      <div className="flex-1">
        {addresses.map((addr, index) => (
          <div key={addr.id}>
            <AddressCard address={addr} />
            {index < addresses.length - 1 && (
              <div className="h-px bg-gray-100 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* 하단 CTA 버튼 */}
      <div className="p-4 pb-8">
        <Link
          href="/mypage/addresses/new"
          className="flex items-center justify-center gap-2 w-full bg-[#2DB400] text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-[#269900] active:bg-[#1F8000] transition-colors"
        >
          <Plus className="size-5" />
          새 주소 추가
        </Link>
      </div>
    </div>
  );
}
