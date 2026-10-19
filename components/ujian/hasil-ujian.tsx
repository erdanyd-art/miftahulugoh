import Link from "next/link";
import { Kartu } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { FormSkorIsian, TombolUmumkan } from "@/components/ujian/form-penilaian";
import { TeksSoal } from "@/components/ujian/teks-soal";
import type { DataHasil } from "@/lib/data/penilaian";
import { formatWaktu } from "@/lib/waktu";

const angka = (n: number | null) => (n === null ? "—" : String(n).replace(".", ","));

// Rekap nilai + pemeriksaan isian. Dipakai admin (/ujian/[id]/hasil) dan tutor (/periksa-ujian/[id]).
export function HasilUjian({ data, admin }: { data: DataHasil; admin: boolean }) {
  const { info, hasil, isian, zona, ditutup } = data;
  const mengerjakan = hasil.filter((h) => h.percobaan_id);
  const belum = hasil.reduce((n, h) => n + (h.isian_belum ?? 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl" dir="auto">
          Hasil: {info.judul}
        </h1>
        <Chip warna={info.diumumkan_pada ? "hijau" : "netral"}>
          {info.diumumkan_pada ? "Nilai diumumkan" : "Belum diumumkan"}
        </Chip>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        {info.kelas} · {formatWaktu(info.mulai, zona)} – {formatWaktu(info.selesai, zona)}
      </p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Nilai peserta" className="xl:col-span-2">
          <p className="mb-3 text-sm text-muted-foreground">
            {mengerjakan.length} dari {hasil.length} peserta mengerjakan. Klik nama peserta untuk melihat jawabannya. Nilai = skor / total bobot ({hasil[0]?.total_bobot ?? 0})
            × 100. Pilihan ganda dinilai otomatis.
          </p>
          <div className="hidden grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-3 border-b pb-2 text-xs text-muted-foreground md:grid">
            <span>Peserta</span>
            <span>Pilihan ganda</span>
            <span>Isian</span>
            <span>Nilai</span>
            <span>Status</span>
          </div>
          <ul className="divide-y">
            {hasil.map((h) => (
              <li
                key={h.peserta_id}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 py-3 text-sm md:grid-cols-[3fr_1fr_1fr_1fr_1fr] md:items-center"
              >
                {h.percobaan_id ? (
                  <Link
                    href={`${admin ? `/ujian/${info.id}/hasil` : `/periksa-ujian/${info.id}`}/${h.percobaan_id}`}
                    className="font-medium text-accent hover:underline"
                    title="Lihat jawaban"
                  >
                    {h.nama}
                  </Link>
                ) : (
                  <span className="font-medium">{h.nama}</span>
                )}
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm md:text-foreground">
                  <span className="md:hidden">PG </span>
                  {h.percobaan_id ? h.skor_pg : "—"}
                  <span className="md:hidden"> · Isian {h.percobaan_id ? h.skor_isian : "—"}</span>
                </span>
                <span className="hidden md:block">{h.percobaan_id ? h.skor_isian : "—"}</span>
                <span className="col-start-2 row-start-1 text-right font-judul text-lg md:col-start-auto md:row-start-auto md:text-left">
                  {angka(h.nilai)}
                </span>
                <span className="col-start-2 row-start-2 text-right md:col-start-auto md:row-start-auto md:text-left">
                  {!h.percobaan_id ? (
                    <Chip warna="merah">Tidak mengerjakan</Chip>
                  ) : !h.selesai_pada ? (
                    <Chip warna="kuning">Mengerjakan</Chip>
                  ) : h.isian_belum ? (
                    <Chip warna="kuning">{h.isian_belum} isian belum dinilai</Chip>
                  ) : (
                    <Chip warna="hijau">Lengkap</Chip>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <a
            href={`/ekspor/nilai?ujian=${info.id}`}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Ekspor CSV nilai
          </a>
        </Kartu>

        <Kartu judul="Pengumuman">
          <div className="flex flex-col gap-3 text-sm">
            {belum > 0 && (
              <p className="rounded-xl bg-status-menunggu px-3 py-2 text-status-menunggu-foreground">
                Masih ada {belum} jawaban isian yang belum dinilai.
              </p>
            )}
            {!ditutup && <p className="text-muted-foreground">Ujian belum ditutup. Nilai bisa diumumkan setelah ujian ditutup.</p>}
            {info.diumumkan_pada && (
              <p className="text-muted-foreground">Diumumkan {formatWaktu(info.diumumkan_pada, zona)}.</p>
            )}
            {admin ? (
              (ditutup || info.diumumkan_pada) && <TombolUmumkan ujianId={info.id} diumumkan={!!info.diumumkan_pada} />
            ) : (
              <p className="text-muted-foreground">Admin yang mengumumkan nilai ke peserta.</p>
            )}
          </div>
        </Kartu>
      </div>

      <section id="periksa" className="scroll-mt-6">
        <Kartu judul="Periksa jawaban isian">
          {isian.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada jawaban isian dari peserta yang sudah selesai. Jawaban kosong otomatis bernilai 0.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {isian.map((g) => (
                <div key={g.soalId} className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Soal {g.nomor} · bobot {g.bobot}
                    </p>
                    <p className="mt-1">
                      <TeksSoal teks={g.pertanyaan} className="block" />
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Acuan: <TeksSoal teks={g.acuan || "—"} />
                    </p>
                  </div>
                  <ul className="flex flex-col divide-y">
                    {g.jawaban.map((j) => (
                      <li key={j.jawaban_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-muted-foreground">{j.peserta}</p>
                          <p>
                            <TeksSoal teks={j.isian ?? ""} className="block" />
                          </p>
                        </div>
                        <FormSkorIsian jawabanId={j.jawaban_id} bobot={g.bobot} skor={j.skor_isian} peserta={j.peserta} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Kartu>
      </section>
    </>
  );
}
