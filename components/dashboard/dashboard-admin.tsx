import Link from "next/link";
import { DaftarJadwalHariIni } from "@/components/absensi/jadwal-hari-ini";
import { Kartu } from "@/components/halaman";
import { GrafikBulanan } from "@/components/keuangan/grafik-bulanan";
import { jadwalHariIni } from "@/lib/data/absensi";
import { jumlahBelumLunas, rekapBulanan } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { bulanMundur, namaBulan } from "@/lib/waktu";

export async function DashboardAdmin() {
  const { jadwal, waktu } = await jadwalHariIni();
  const [rekap, belumLunas] = await Promise.all([rekapBulanan(bulanMundur(waktu.bulan, 6)), jumlahBelumLunas()]);
  const ini = rekap[rekap.length - 1];
  const ringkasan = [
    { judul: "Pemasukan", nilai: ini.pemasukan, warna: "bg-pastel-kuning" },
    { judul: "Pengeluaran", nilai: ini.pengeluaran, warna: "bg-pastel-ungu" },
    { judul: "Selisih", nilai: ini.pemasukan - ini.pengeluaran, warna: "bg-pastel-biru" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Dashboard</h1>

      <section aria-label="Ringkasan kas bulan ini" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ringkasan.map(({ judul, nilai, warna }) => (
          <div key={judul} className={cn("flex flex-col gap-3 rounded-3xl p-5 text-foreground", warna)}>
            <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Kas</span>
            <p className="font-judul text-lg">
              {judul} {namaBulan(waktu.bulan)}
            </p>
            <p className="font-judul text-3xl">{formatRupiah(nilai)}</p>
            <div className="mt-auto flex justify-end">
              <Link
                href="/keuangan"
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
          <span className="w-fit rounded-md bg-pastel-kuning px-2 py-0.5 text-xs font-medium text-foreground">Pembayaran</span>
          <h2 className="text-lg">Pembayaran peserta belum lunas</h2>
          <p className="font-judul text-5xl">{belumLunas.jumlahData}</p>
          <p className="text-sm text-sidebar-foreground">
            Catatan berstatus Belum Lunas (semua bulan), total {formatRupiah(belumLunas.total)}.
          </p>
          <Link
            href="/pembayaran?status=belum_lunas"
            className="mt-auto rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Lihat pembayaran
          </Link>
        </section>
      </div>

      <Kartu judul="Kas 6 bulan terakhir">
        <GrafikBulanan data={rekap} />
        <Link href="/keuangan/rekap" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Lihat rekap lengkap
        </Link>
      </Kartu>
    </div>
  );
}
