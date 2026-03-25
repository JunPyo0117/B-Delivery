import { notFound } from "next/navigation";
import { getReportDetail } from "../actions";
import { ReportDetailClient } from "./_components/report-detail-client";

export const metadata = { title: "신고 상세 | 관리자" };

interface Props {
  params: Promise<{ reportId: string }>;
}

export default async function ReportDetailPage({ params }: Props) {
  const { reportId } = await params;

  try {
    const report = await getReportDetail(reportId);
    return (
      <ReportDetailClient report={JSON.parse(JSON.stringify(report))} />
    );
  } catch {
    notFound();
  }
}
