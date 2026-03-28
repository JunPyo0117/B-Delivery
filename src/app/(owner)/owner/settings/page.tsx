import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSettings } from "./_actions/settings-actions";
import { SettingsForm } from "./_components/settings-form";

export const metadata = { title: "가게 설정 - B-Delivery" };

export default async function OwnerSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const restaurant = await getSettings();

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-lg font-semibold text-gray-900 mb-2">
          등록된 음식점이 없습니다
        </p>
        <p className="text-sm text-gray-500">
          먼저 음식점을 등록해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)]">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <h1 className="text-xl font-bold text-gray-900">가게 설정</h1>
        <p className="text-sm text-gray-500 mt-1">
          음식점 정보를 수정할 수 있습니다.
        </p>
      </div>
      <SettingsForm restaurant={restaurant} />
    </div>
  );
}
