import { getMenus } from "./actions";
import { MenuList } from "./_components/menu-list";

export const metadata = { title: "메뉴 관리 - B-Delivery 사장님" };

export default async function OwnerMenusPage() {
  const menus = await getMenus();

  return (
    <div className="p-4">
      <MenuList initialMenus={menus} />
    </div>
  );
}
