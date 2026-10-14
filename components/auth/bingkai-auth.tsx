import type { ReactNode } from "react";
import { LogoTanda } from "@/components/layout/logo";

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

export function KolomIsian({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        {...props}
        className="h-11 rounded-xl border border-input bg-card px-4 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring"
      />
    </label>
  );
}

export function PesanStatus({ galat, pesan }: { galat?: string; pesan?: string }) {
  if (galat) {
    return (
      <p role="alert" className="rounded-xl bg-status-belum px-4 py-3 text-sm text-status-belum-foreground">
        {galat}
      </p>
    );
  }
  if (pesan) {
    return (
      <p role="status" className="rounded-xl bg-status-lunas px-4 py-3 text-sm text-status-lunas-foreground">
        {pesan}
      </p>
    );
  }
  return null;
}
