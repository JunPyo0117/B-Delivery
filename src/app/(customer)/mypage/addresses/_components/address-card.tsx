"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Pencil, Trash2, Loader2 } from "lucide-react";

import { deleteAddress, setDefaultAddress } from "../actions";

interface AddressCardProps {
  address: {
    id: string;
    label: string;
    address: string;
    addressDetail: string | null;
    isDefault: boolean;
  };
}

export function AddressCard({ address }: AddressCardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSetting, startSetTransition] = useTransition();

  function handleSetDefault() {
    startSetTransition(async () => {
      await setDefaultAddress(address.id);
      await updateSession();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("이 주소를 삭제하시겠습니까?")) return;

    startDeleteTransition(async () => {
      await deleteAddress(address.id);
      await updateSession();
      router.refresh();
    });
  }

  const isPending = isDeleting || isSetting;

  return (
    <div className="flex items-start gap-3 px-4 py-4">
      {/* 아이콘 */}
      <div className="mt-0.5">
        <MapPin
          className={`size-5 ${
            address.isDefault ? "text-[#2DB400]" : "text-gray-400"
          }`}
        />
      </div>

      {/* 주소 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {address.isDefault && (
            <span className="text-[11px] font-semibold text-[#2DB400] bg-[#2DB400]/10 px-2 py-0.5 rounded-full">
              기본 배달 주소
            </span>
          )}
        </div>
        <p className="text-[15px] font-semibold text-gray-900">
          {address.label}
        </p>
        <p className="text-[13px] text-gray-600 mt-0.5 leading-relaxed">
          {address.address}
        </p>
        {address.addressDetail && (
          <p className="text-[13px] text-gray-400 mt-0.5">
            {address.addressDetail}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3 mt-2.5">
          {!address.isDefault && (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={isPending}
              className="text-[12px] text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition-colors underline underline-offset-2"
            >
              {isSetting ? (
                <Loader2 className="size-3 animate-spin inline" />
              ) : (
                "기본 주소로 설정"
              )}
            </button>
          )}
          <Link
            href={`/mypage/addresses/${address.id}/edit`}
            className="text-[12px] text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-0.5"
          >
            <Pencil className="size-3" />
            수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-[12px] text-gray-400 hover:text-[#FF5252] disabled:text-gray-300 transition-colors flex items-center gap-0.5"
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-3" />
                삭제
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
