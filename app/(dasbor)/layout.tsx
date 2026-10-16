import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { penggunaWajib } from "@/lib/auth";

// Bingkai navy dengan panel konten terang yang membulat (desktop); layar penuh di ponsel.
// Peran dan nama dibaca dari database (lib/auth.ts); pembacaan sesi harus di dalam <Suspense>.
export default function DasborLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-sidebar">
      <Suspense fallback={<div className="min-h-screen flex-1 bg-background lg:my-3 lg:mr-3 lg:ml-60 lg:rounded-[2rem]" />}>
        <Kerangka>{children}</Kerangka>
      </Suspense>
    </div>
  );
}

async function Kerangka({ children }: { children: ReactNode }) {
  const pengguna = await penggunaWajib();
  // Kata sandi awal dari admin (akun peserta) harus diganti sebelum memakai dashboard.
  if (pengguna.wajibGantiSandi) redirect("/ganti-sandi");
  return (
    <>
      <Sidebar peran={pengguna.peran} />
      <div className="flex min-w-0 flex-1 flex-col bg-background lg:my-3 lg:mr-3 lg:rounded-[2rem]">
        <Header peran={pengguna.peran} nama={pengguna.nama} />
        <main className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
