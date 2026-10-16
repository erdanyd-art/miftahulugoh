import Link from "next/link";
import { Chip } from "@/components/tabel";
import { daftarUjianSaya, type StatusUjianSaya } from "@/lib/data/ujian-peserta";
import { formatWaktu } from "@/lib/waktu";

export const LABEL_STATUS: Record<StatusUjianSaya, { label: string; warna: "hijau" | "kuning" | "merah" | "netral" }> = {
  terjadwal: { label: "Terjadwal", warna: "netral" },
  dibuka: { label: "Bisa dikerjakan", warna: "hijau" },
  dikerjakan: { label: "Sedang dikerjakan", warna: "kuning" },
  selesai: { label: "Selesai", warna: "netral" },
  terlewat: { label: "Terlewat", warna: "merah" },
};

// Beranda peserta: ujian kelasnya. Yang bisa dikerjakan ditaruh paling atas.
export async function DashboardPeserta({ nama }: { nama: string }) {
  const { zona, ujian } = await daftarUjianSaya();
  const urutan: StatusUjianSaya[] = ["dikerjakan", "dibuka", "terjadwal", "selesai", "terlewat"];
  const tersusun = [...ujian].sort((a, b) => urutan.indexOf(a.status) - urutan.indexOf(b.status));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Assalamu&apos;alaikum, {nama}</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Ujian</h2>
        {tersusun.length === 0 ? (
          <p className="rounded-3xl bg-pastel-biru p-6 text-sm text-pastel-muted">
            Belum ada ujian untuk Anda. Ujian dari lembaga akan tampil di sini.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tersusun.map((u) => {
              const s = LABEL_STATUS[u.status];
              const bisa = u.status === "dibuka" || u.status === "dikerjakan";
              return (
                <li key={u.id}>
                  <Link
                    href={`/ujian-saya/${u.id}`}
                    className={`flex flex-col gap-2 rounded-3xl p-5 shadow-sm focus-visible:outline-2 focus-visible:outline-ring ${bisa ? "bg-pastel-kuning" : "bg-card"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-judul text-lg" dir="auto">
                        {u.judul}
                      </span>
                      <Chip warna={s.warna}>{s.label}</Chip>
                      {u.nilai && <Chip warna="hijau">Nilai {String(u.nilai.nilai ?? 0).replace(".", ",")}</Chip>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {u.kelas} · {formatWaktu(u.mulai, zona)} – {formatWaktu(u.selesai, zona)} · {u.durasi_menit} menit
                    </span>
                    {bisa && (
                      <span className="w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                        {u.status === "dikerjakan" ? "Lanjutkan" : "Buka ujian"}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
