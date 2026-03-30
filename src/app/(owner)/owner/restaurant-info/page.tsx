import { redirect } from "next/navigation";

export const metadata = { title: "가게 정보 수정 - B-Delivery" };

/**
 * 기존 /owner/restaurant-info 경로를 /owner/settings로 리다이렉트합니다.
 * 이전 링크의 호환성을 유지하기 위해 남겨둡니다.
 */
export default function RestaurantInfoPage() {
  redirect("/owner/settings");
}
