import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

// Sprint 0: kerangka saja. Menu per peran dan nama pengguna dibaca dari database mulai Sprint 2.
export default function DasborLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <Sidebar peran="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header peran="admin" nama="Pengguna" />
        <main className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
