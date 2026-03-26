import { Metadata } from "next";
import { DeliveryRadiusClient } from "./_components/DeliveryRadiusClient";

export const metadata: Metadata = {
  title: "배달 반경 관리",
};

export default function DeliveryRadiusPage() {
  return <DeliveryRadiusClient />;
}
