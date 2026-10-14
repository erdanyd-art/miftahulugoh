import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

// Bingkai navy dengan panel konten terang yang membulat (desktop); layar penuh di ponsel.
// Sprint 0: kerangka saja. Menu per peran dan nama pengguna dibaca dari database mulai Sprint 2.
export default function DasborLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-sidebar">
      <Sidebar peran="admin" />
      <div className="flex min-w-0 flex-1 flex-col bg-background lg:my-3 lg:mr-3 lg:rounded-[2rem]">
        <Header peran="admin" nama="Pengguna" />
        <main className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
