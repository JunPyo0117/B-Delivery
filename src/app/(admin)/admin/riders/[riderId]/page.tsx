import { notFound } from "next/navigation";
import { getRiderDetail } from "../actions";
import { RiderDetailClient } from "./_components/rider-detail-client";

export const metadata = { title: "기사 상세 | 관리자" };

interface Props {
  params: Promise<{ riderId: string }>;
}

export default async function RiderDetailPage({ params }: Props) {
  const { riderId } = await params;

  try {
    const rider = await getRiderDetail(riderId);
    return <RiderDetailClient rider={JSON.parse(JSON.stringify(rider))} />;
  } catch {
    notFound();
  }
}
