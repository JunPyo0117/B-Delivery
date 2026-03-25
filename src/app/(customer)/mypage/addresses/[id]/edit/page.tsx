import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AddressForm } from "../../_components/address-form";

interface EditAddressPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAddressPage({
  params,
}: EditAddressPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const address = await prisma.userAddress.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      label: true,
      address: true,
      addressDetail: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!address || address.userId !== session.user.id) {
    notFound();
  }

  return (
    <AddressForm
      mode="edit"
      initialData={{
        id: address.id,
        label: address.label,
        address: address.address,
        addressDetail: address.addressDetail,
        latitude: address.latitude,
        longitude: address.longitude,
      }}
    />
  );
}
