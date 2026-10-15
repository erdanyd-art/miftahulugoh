import type { ReactNode } from "react";
import { LogoTanda } from "@/components/layout/logo";
import { HiasanKanan, HiasanKiri } from "./hiasan";

export { KolomIsian, PesanStatus } from "@/components/form";

// Kerangka halaman di luar dashboard (masuk, lupa sandi, pesan akses): latar krem, kartu di tengah,
// hiasan garis di kiri-kanan pada layar lebar.
export function BingkaiAuth({ judul, keterangan, children }: { judul: string; keterangan?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-krem">
      <header className="relative z-10 flex items-center gap-3 px-6 py-5 sm:px-10">
        <LogoTanda />
        <div className="leading-tight">
          <p className="font-judul text-lg">Miftah al-Lughah</p>
          <p className="text-xs text-muted-foreground">Dashboard lembaga kursus bahasa</p>
        </div>
      </header>

      <HiasanKiri className="pointer-events-none absolute bottom-16 left-[4%] hidden w-64 text-primary lg:block xl:left-[8%] xl:w-72" />
      <HiasanKanan className="pointer-events-none absolute right-[4%] bottom-16 hidden w-64 text-primary lg:block xl:right-[8%] xl:w-80" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-card px-6 py-8 shadow-[0_10px_40px_-12px_rgb(19_33_74/0.18)] sm:px-10 sm:py-10">
          <h1 className="text-center text-3xl">{judul}</h1>
          {keterangan && <p className="mx-auto mt-2 max-w-xs text-center text-sm text-muted-foreground">{keterangan}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-6 text-center text-xs text-muted-foreground">
        © Lembaga Miftah al-Lughah · Bahasa Arab, Bahasa Inggris, Nahwu Shorof
      </footer>
    </div>
  );
}
