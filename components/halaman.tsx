import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KepalaHalaman({
  judul,
  tombol,
  tombolKedua,
}: {
  judul: string;
  tombol?: { href: string; label: string };
  tombolKedua?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl">{judul}</h1>
      <div className="flex flex-wrap gap-2">
      {tombolKedua && (
        <Link
          href={tombolKedua.href}
          className="rounded-full border bg-card px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {tombolKedua.label}
        </Link>
      )}
      {tombol && (
        <Link
          href={tombol.href}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {tombol.label}
        </Link>
      )}
      </div>
    </div>
  );
}

export function TautanKembali({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="w-fit text-sm font-medium text-accent hover:underline">
      ← {label}
    </Link>
  );
}

export function Kartu({ judul, children, className }: { judul?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-card p-5 shadow-sm sm:p-6", className)}>
      {judul && <h2 className="mb-4 text-lg">{judul}</h2>}
      {children}
    </section>
  );
}

export function Memuat() {
  return <p className="text-sm text-muted-foreground">Memuat...</p>;
}

// Pesan sukses setelah dialihkan dengan ?pesan=disimpan
export const PESAN_UMUM: Record<string, string> = {
  disalin: "Salinan dibuat sebagai draf. Periksa waktu dan soalnya, lalu terbitkan.",
  disimpan: "Data tersimpan.",
  dihapus: "Data dihapus (tetap tercatat di log audit).",
};
