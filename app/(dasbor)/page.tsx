import Link from "next/link";
import { cn } from "@/lib/utils";

const ringkasan = [
  { chip: "Kas", judul: "Pemasukan bulan ini", warna: "bg-pastel-kuning", href: "/keuangan" },
  { chip: "Kas", judul: "Pengeluaran bulan ini", warna: "bg-pastel-ungu", href: "/keuangan" },
  { chip: "Kas", judul: "Selisih bulan ini", warna: "bg-pastel-biru", href: "/keuangan" },
];

type StatusAbsen = "sudah" | "menunggu" | "belum";

const chipStatus: Record<StatusAbsen, { label: string; kelas: string }> = {
  sudah: { label: "Sudah absen", kelas: "bg-status-lunas text-status-lunas-foreground" },
  menunggu: { label: "Belum waktunya", kelas: "bg-status-menunggu text-status-menunggu-foreground" },
  belum: { label: "Belum absen", kelas: "bg-status-belum text-status-belum-foreground" },
};

// CONTOH TAMPILAN saja (fiktif). Diganti data jadwal hari ini dari database di Sprint 5.
const contohAbsensi: { kelas: string; tutor: string; jam: string; hadir: string; status: StatusAbsen }[] = [
  { kelas: "Bahasa Arab Dasar", tutor: "Ustadz Fulan", jam: "08.00–09.30", hadir: "3/3", status: "sudah" },
  { kelas: "Nahwu Shorof", tutor: "Ustadzah Fulanah", jam: "10.00–11.00", hadir: "–", status: "belum" },
  { kelas: "Bahasa Inggris", tutor: "Ustadzah Fulanah", jam: "16.00–17.00", hadir: "–", status: "menunggu" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ringkasan.map(({ chip, judul, warna, href }) => (
          <div key={judul} className={cn("flex flex-col gap-3 rounded-3xl p-5 text-foreground", warna)}>
            <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {chip}
            </span>
            <p className="font-medium">{judul}</p>
            <p className="text-2xl font-semibold">–</p>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-xs text-pastel-muted">Belum ada data</span>
              <Link
                href={href}
                className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Detail
              </Link>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Absensi tutor hari ini</h2>
            <Link href="/absensi" className="text-sm font-medium text-accent hover:underline">
              Lihat semua
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Contoh tampilan (data fiktif)</p>

          <div className="mt-4 hidden grid-cols-[2fr_1.5fr_1fr_0.6fr_auto] gap-4 border-b pb-2 text-xs text-muted-foreground sm:grid">
            <span>Kelas</span>
            <span>Tutor</span>
            <span>Jam</span>
            <span>Hadir</span>
            <span className="w-32 text-right">Status</span>
          </div>
          <ul className="divide-y">
            {contohAbsensi.map((baris) => (
              <li
                key={baris.kelas}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[2fr_1.5fr_1fr_0.6fr_auto]"
              >
                <span className="text-sm font-medium">{baris.kelas}</span>
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground sm:col-start-auto sm:row-start-auto sm:text-sm sm:text-foreground">
                  {baris.tutor}
                  <span className="sm:hidden"> · {baris.jam}</span>
                </span>
                <span className="hidden text-sm sm:block">{baris.jam}</span>
                <span className="hidden text-sm sm:block">{baris.hadir}</span>
                <span className="col-start-2 row-span-2 row-start-1 flex w-32 justify-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                  <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium", chipStatus[baris.status].kelas)}>
                    {chipStatus[baris.status].label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-primary p-6 text-primary-foreground">
          <span className="w-fit rounded-md bg-pastel-kuning px-2 py-0.5 text-xs font-medium text-foreground">
            Pembayaran
          </span>
          <h2 className="text-lg font-semibold">Pembayaran peserta belum lunas</h2>
          <p className="text-4xl font-semibold">–</p>
          <p className="text-sm text-sidebar-foreground">Jumlah tagihan berstatus Belum Lunas bulan ini.</p>
          <Link
            href="/pembayaran"
            className="mt-auto rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Lihat pembayaran
          </Link>
        </section>
      </div>
    </div>
  );
}
