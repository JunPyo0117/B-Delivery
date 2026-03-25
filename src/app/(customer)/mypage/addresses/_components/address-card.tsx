"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const { update: updateSession } = useSession();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSetting, startSetTransition] = useTransition();

  function handleSetDefault() {
    startSetTransition(async () => {
      await setDefaultAddress(address.id);
      await updateSession();
    });
  }

  function handleDelete() {
    if (!confirm("이 주소를 삭제하시겠습니까?")) return;

    startDeleteTransition(async () => {
      await deleteAddress(address.id);
      await updateSession();
    });
  }

  const isPending = isDeleting || isSetting;

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{address.label}</span>
          {address.isDefault && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              기본
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {address.address}
        </p>
        {address.addressDetail && (
          <p className="text-sm text-muted-foreground truncate">
            {address.addressDetail}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          {!address.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetDefault}
              disabled={isPending}
            >
              {isSetting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "기본 주소로 설정"
              )}
            </Button>
          )}
          <Link href={`/mypage/addresses/${address.id}/edit`}>
            <Button variant="ghost" size="icon-sm" disabled={isPending}>
              <Pencil className="size-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5 text-destructive" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
