import { BottomNav } from "./_components/bottom-nav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-14">{children}</main>
      <BottomNav />
    </div>
  );
}
