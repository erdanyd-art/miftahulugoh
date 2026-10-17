import { Kartu } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { FormSkorIsian } from "@/components/ujian/form-penilaian";
import { TeksSoal } from "@/components/ujian/teks-soal";
import type { ambilJawabanPercobaan } from "@/lib/data/penilaian";
import { HURUF_OPSI } from "@/lib/validasi/ujian";
import { formatWaktu } from "@/lib/waktu";

type Data = NonNullable<Awaited<ReturnType<typeof ambilJawabanPercobaan>>>;

// Lembar jawaban satu peserta untuk pemeriksa: jawaban, kunci, benar/salah, skor isian (bisa dinilai di sini).
export function JawabanPeserta({ data }: { data: Data }) {
  const { soal, info, zona } = data;
  const total = soal.reduce((n, s) => n + s.bobot, 0);
  const skor = soal.reduce((n, s) => n + (s.skor ?? 0), 0);
  const selesai = Boolean(info.selesai_pada);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Jawaban {info.peserta}</h1>
        <Chip warna={selesai ? "hijau" : "kuning"}>{selesai ? "Selesai" : "Masih mengerjakan"}</Chip>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Mulai {formatWaktu(info.mulai_pada, zona)}
        {info.selesai_pada && ` · selesai ${formatWaktu(info.selesai_pada, zona)}`} · skor sementara {skor} dari {total}
      </p>

      <Kartu>
        <ol className="flex flex-col divide-y">
          {soal.map((s) => {
            const dijawab = s.jenis === "pilihan_ganda" ? s.pilihan !== null : Boolean(s.isian);
            return (
              <li key={s.soal_id} className="flex flex-col gap-2 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-judul text-base">No. {s.nomor}</span>
                  <span className="text-muted-foreground">
                    {s.jenis === "isian" ? "Isian" : "Pilihan ganda"} · bobot {s.bobot}
                  </span>
                  {!dijawab ? (
                    <Chip warna="netral">Tidak dijawab</Chip>
                  ) : s.jenis === "pilihan_ganda" ? (
                    <Chip warna={s.benar ? "hijau" : "merah"}>{s.benar ? "Benar" : "Salah"}</Chip>
                  ) : s.skor_isian === null ? (
                    <Chip warna="kuning">Belum dinilai</Chip>
                  ) : (
                    <Chip warna="hijau">
                      Skor {s.skor_isian}/{s.bobot}
                    </Chip>
                  )}
                </div>
                <p>
                  <TeksSoal teks={s.pertanyaan} className="block" />
                </p>

                {s.jenis === "pilihan_ganda" ? (
                  <ul className="grid gap-1 text-sm sm:grid-cols-2">
                    {(s.opsi ?? []).map((o, i) => {
                      const kunci = s.jawaban_benar === i;
                      const dipilih = s.pilihan === i;
                      return (
                        <li
                          key={i}
                          className={
                            kunci
                              ? "rounded-lg bg-status-lunas px-2 py-1 text-status-lunas-foreground"
                              : dipilih
                                ? "rounded-lg bg-status-belum px-2 py-1 text-status-belum-foreground"
                                : "px-2 py-1"
                          }
                        >
                          <span className="font-semibold">{HURUF_OPSI[i]}.</span> <TeksSoal teks={o} />
                          {dipilih && <span className="ml-1 text-xs font-semibold">← dipilih</span>}
                          {kunci && <span className="sr-only"> (kunci jawaban)</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="rounded-xl bg-secondary px-3 py-2">
                        {s.isian ? <TeksSoal teks={s.isian} className="block" /> : <span className="text-muted-foreground">—</span>}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Acuan: <TeksSoal teks={s.acuan || "—"} />
                      </p>
                    </div>
                    {s.jawaban_id && s.isian && selesai && (
                      <FormSkorIsian jawabanId={s.jawaban_id} bobot={s.bobot} skor={s.skor_isian} peserta={info.peserta} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Kartu>
    </>
  );
}
