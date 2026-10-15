import Link from "next/link";
import { DaftarJadwalHariIni } from "@/components/absensi/jadwal-hari-ini";
import { jadwalHariIni } from "@/lib/data/absensi";
import { cn } from "@/lib/utils";

const ringkasan = [
  { chip: "Kas", judul: "Pemasukan bulan ini", warna: "bg-pastel-kuning", href: "/keuangan" },
  { chip: "Kas", judul: "Pengeluaran bulan ini", warna: "bg-pastel-ungu", href: "/keuangan" },
  { chip: "Kas", judul: "Selisih bulan ini", warna: "bg-pastel-biru", href: "/keuangan" },
];

export async function DashboardAdmin() {
  const { jadwal, waktu } = await jadwalHariIni();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Dashboard</h1>

      <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ringkasan.map(({ chip, judul, warna, href }) => (
          <div key={judul} className={cn("flex flex-col gap-3 rounded-3xl p-5 text-foreground", warna)}>
            <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {chip}
            </span>
            <p className="font-judul text-lg">{judul}</p>
            <p className="font-judul text-3xl">–</p>
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
            <h2 className="text-lg">Absensi tutor hari ini</h2>
            <Link href="/absensi" className="text-sm font-medium text-accent hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-2">
            <DaftarJadwalHariIni jadwal={jadwal} waktu={waktu} tampilkanTutor />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-primary p-6 text-primary-foreground">
          <span className="w-fit rounded-md bg-pastel-kuning px-2 py-0.5 text-xs font-medium text-foreground">
            Pembayaran
          </span>
          <h2 className="text-lg">Pembayaran peserta belum lunas</h2>
          <p className="font-judul text-5xl">–</p>
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
