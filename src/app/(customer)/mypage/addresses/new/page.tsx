import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AddressForm } from "../_components/address-form";

export default async function NewAddressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <AddressForm mode="create" />;
}
