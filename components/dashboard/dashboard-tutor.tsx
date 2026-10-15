import Link from "next/link";
import { DaftarJadwalHariIni } from "@/components/absensi/jadwal-hari-ini";
import { Kartu } from "@/components/halaman";
import { honorBulanIni, jadwalHariIni } from "@/lib/data/absensi";
import { formatRupiah } from "@/lib/format";
import { namaBulan } from "@/lib/waktu";

export async function DashboardTutor() {
  const [{ jadwal, waktu }, honor] = await Promise.all([jadwalHariIni(), honorBulanIni()]);
  const sudah = jadwal.filter((j) => j.sesi).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Dashboard</h1>

      <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-3xl bg-pastel-kuning p-5 text-foreground">
          <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Jadwal</span>
          <p className="font-judul text-lg">Sesi hari ini</p>
          <p className="font-judul text-3xl">{jadwal.length}</p>
          <span className="text-xs text-pastel-muted">
            {sudah} sudah diabsen · {jadwal.length - sudah} belum
          </span>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl bg-pastel-biru p-5 text-foreground">
          <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Honor</span>
          <p className="font-judul text-lg">Honor {namaBulan(waktu.bulan)}</p>
          <p className="font-judul text-3xl">{formatRupiah(honor.total)}</p>
          <Link href="/honor-saya" className="w-fit text-xs font-medium text-pastel-muted underline">
            Lihat riwayat dan saldo
          </Link>
        </div>
      </section>

      <Kartu judul="Jadwal hari ini">
        <DaftarJadwalHariIni jadwal={jadwal} waktu={waktu} tampilkanTutor={false} />
      </Kartu>
    </div>
  );
}
