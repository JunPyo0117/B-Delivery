import { Metadata } from "next";
import { DeliveryRadiusClient } from "./_components/DeliveryRadiusClient";

export const metadata: Metadata = {
  title: "배달 반경 제어",
};

export default function DeliveryRadiusPage() {
  return (
    <main className="min-h-dvh bg-gray-50">
      <DeliveryRadiusClient />
    </main>
  );
}
