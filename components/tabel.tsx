import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ParamUrl, urlDengan } from "@/lib/tabel";

// Formulir filter memakai GET: hasilnya tercermin di URL, bisa dibagikan dan di-refresh.
export function FormFilter({ aksi, children }: { aksi: string; children: ReactNode }) {
  return (
    <form action={aksi} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {children}
      <button
        type="submit"
        className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Terapkan
      </button>
    </form>
  );
}

export function JudulUrut({
  label,
  kolom,
  dasar,
  sp,
  className,
}: {
  label: string;
  kolom: string;
  dasar: string;
  sp: ParamUrl;
  className?: string;
}) {
  const aktif = sp.urut === kolom;
  const turun = aktif && sp.arah === "turun";
  const href = urlDengan(dasar, sp, { urut: kolom, arah: aktif && !turun ? "turun" : "", halaman: "" });
  const Ikon = turun ? ArrowDown : ArrowUp;
  return (
    <Link href={href} className={cn("inline-flex items-center gap-1 hover:text-foreground", className)}>
      {label}
      {aktif && <Ikon className="size-3" aria-label={turun ? "urut menurun" : "urut menaik"} />}
    </Link>
  );
}

export function Halaman({
  nomor,
  total,
  jumlah,
  dasar,
  sp,
}: {
  nomor: number;
  total: number;
  jumlah: number;
  dasar: string;
  sp: ParamUrl;
}) {
  const tombol = "rounded-full border px-4 py-1.5 text-sm font-medium";
  return (
    <nav aria-label="Halaman" className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {jumlah} data · halaman {nomor} dari {total}
      </span>
      <span className="flex gap-2">
        {nomor > 1 ? (
          <Link href={urlDengan(dasar, sp, { halaman: String(nomor - 1) })} className={tombol}>
            Sebelumnya
          </Link>
        ) : null}
        {nomor < total ? (
          <Link href={urlDengan(dasar, sp, { halaman: String(nomor + 1) })} className={tombol}>
            Berikutnya
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

export function Chip({ warna, children }: { warna: "hijau" | "kuning" | "merah" | "netral"; children: ReactNode }) {
  const kelas = {
    hijau: "bg-status-lunas text-status-lunas-foreground",
    kuning: "bg-status-menunggu text-status-menunggu-foreground",
    merah: "bg-status-belum text-status-belum-foreground",
    netral: "bg-secondary text-secondary-foreground",
  }[warna];
  return <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium", kelas)}>{children}</span>;
}
