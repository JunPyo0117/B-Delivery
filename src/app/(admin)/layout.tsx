import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
