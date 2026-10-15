import type { ReactNode } from "react";
import { LogoTanda } from "@/components/layout/logo";

export { KolomIsian, PesanStatus } from "@/components/form";

// Kerangka halaman di luar dashboard (masuk, lupa sandi, pesan akses).
export function BingkaiAuth({ judul, keterangan, children }: { judul: string; keterangan?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-background p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <LogoTanda />
          <p className="text-sm text-muted-foreground">
            Lembaga <span className="font-semibold text-accent">Miftah al-Lughah</span>
          </p>
        </div>
        <h1 className="mt-8 text-2xl font-semibold">{judul}</h1>
        {keterangan && <p className="mt-2 text-sm text-muted-foreground">{keterangan}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
