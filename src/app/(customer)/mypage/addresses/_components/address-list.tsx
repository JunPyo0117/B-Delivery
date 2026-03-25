"use client";

import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <MapPin className="size-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">등록된 주소가 없습니다</p>
        <Link href="/mypage/addresses/new">
          <Button>
            <Plus data-icon="inline-start" className="size-4" />
            주소 추가
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {addresses.map((addr) => (
        <AddressCard key={addr.id} address={addr} />
      ))}

      <Link href="/mypage/addresses/new" className="mt-2">
        <Button variant="outline" className="w-full">
          <Plus data-icon="inline-start" className="size-4" />
          주소 추가
        </Button>
      </Link>
    </div>
  );
}
