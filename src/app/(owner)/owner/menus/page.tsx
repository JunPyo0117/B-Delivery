import { getMenus } from "./actions";
import { MenuTable } from "./_components/menu-table";

export const metadata = { title: "메뉴 관리 - B-Delivery 사장님" };

export default async function OwnerMenusPage() {
  const menus = await getMenus();

  return <MenuTable initialMenus={menus} />;
}
