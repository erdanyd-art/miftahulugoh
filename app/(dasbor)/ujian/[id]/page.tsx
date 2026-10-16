import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PesanStatus } from "@/components/form";
import { Kartu, Memuat, PESAN_UMUM, TautanKembali } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import {
  FormUjian,
  TombolHapusAudio,
  TombolHapusSoal,
  TombolHapusUjian,
  TombolTerbit,
  UnggahAudio,
} from "@/components/ujian/form-ujian";
import { ChipStatusUjian } from "@/components/ujian/status-ujian";
import { TeksSoal } from "@/components/ujian/teks-soal";
import { simpanUjian } from "@/lib/aksi-ujian";
import { pilihanForm } from "@/lib/data/master";
import { ambilUjian } from "@/lib/data/ujian";
import { formatUkuran } from "@/lib/format";
import { param } from "@/lib/tabel";
import { HURUF_OPSI } from "@/lib/validasi/ujian";
import { formatWaktu, isoKeLokal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Ujian" };

export default function HalamanDetailUjian({ params, searchParams }: PageProps<"/ujian/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/ujian" label="Kembali ke daftar ujian" />
      <Suspense fallback={<Memuat />}>
        <Isi params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: PageProps<"/ujian/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [ujian, { kelas }] = await Promise.all([ambilUjian(id), pilihanForm()]);
  if (!ujian) notFound();
  const pesan = PESAN_UMUM[param(await searchParams, "pesan")];
  const totalBobot = ujian.soal.reduce((n, s) => n + s.bobot, 0);
  const judulAudio = new Map(ujian.audio.map((a) => [a.id, a.judul]));

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl" dir="auto">
          {ujian.judul}
        </h1>
        <ChipStatusUjian ujian={ujian} />
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        {ujian.kelas?.nama} · {formatWaktu(ujian.mulai, ujian.zona)} – {formatWaktu(ujian.selesai, ujian.zona)} ·{" "}
        {ujian.durasi_menit} menit
      </p>
      {pesan && <PesanStatus pesan={pesan} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Data ujian" className="xl:col-span-2">
          <FormUjian
            aksi={simpanUjian.bind(null, ujian.id)}
            kelas={kelas}
            awal={{
              judul: ujian.judul,
              keterangan: ujian.keterangan,
              kelasId: ujian.kelas_id,
              mulai: isoKeLokal(ujian.mulai, ujian.zona),
              selesai: isoKeLokal(ujian.selesai, ujian.zona),
              durasiMenit: ujian.durasi_menit,
            }}
          />
        </Kartu>
        <Kartu judul="Penerbitan">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {ujian.terbit
                ? "Ujian sudah terbit. Peserta kelas ini bisa mengerjakannya selama ujian dibuka."
                : "Masih draf: peserta belum melihat ujian ini. Terbitkan setelah soal lengkap."}
            </p>
            <TombolTerbit id={ujian.id} terbit={ujian.terbit} />
            <hr />
            <TombolHapusUjian id={ujian.id} />
          </div>
        </Kartu>
      </div>

      <section id="soal" className="scroll-mt-6">
        <Kartu>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">Soal ({ujian.soal.length})</h2>
              <p className="text-xs text-muted-foreground">Total bobot: {totalBobot}</p>
            </div>
            <Link
              href={`/ujian/${ujian.id}/soal/baru`}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Tambah soal
            </Link>
          </div>
          {ujian.soal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada soal.</p>
          ) : (
            <ol className="flex flex-col divide-y">
              {ujian.soal.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-judul text-base">No. {s.urutan}</span>
                    <Chip warna="netral">{s.jenis === "isian" ? "Isian" : "Pilihan ganda"}</Chip>
                    <span className="text-muted-foreground">Bobot {s.bobot}</span>
                    {s.audio_id && <Chip warna="kuning">Audio: {judulAudio.get(s.audio_id)}</Chip>}
                  </div>
                  <p className="text-base">
                    <TeksSoal teks={s.pertanyaan} className="block" />
                  </p>
                  {s.jenis === "pilihan_ganda" ? (
                    <ul className="grid gap-1 text-sm sm:grid-cols-2">
                      {(s.opsi ?? []).map((o, i) => {
                        const benar = s.kunci?.jawaban_benar === i;
                        return (
                          <li
                            key={i}
                            className={benar ? "rounded-lg bg-status-lunas px-2 py-1 text-status-lunas-foreground" : "px-2 py-1"}
                          >
                            <span className="font-semibold">{HURUF_OPSI[i]}.</span> <TeksSoal teks={o} />
                            {benar && <span className="sr-only"> (kunci jawaban)</span>}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Acuan jawaban: <span dir="auto">{s.kunci?.kunci_isian || "—"}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-start gap-2">
                    <Link
                      href={`/ujian/${ujian.id}/soal/${s.id}`}
                      className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      Ubah
                    </Link>
                    <TombolHapusSoal ujianId={ujian.id} soalId={s.id} nomor={s.urutan} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Kartu>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul={`Audio (${ujian.audio.length})`} className="xl:col-span-2">
          {ujian.audio.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada audio. Unggah lalu pilih di soal yang memakainya.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {ujian.audio.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium" dir="auto">
                      {a.judul}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatUkuran(a.ukuran)} · dipakai {a.dipakai} soal
                    </span>
                  </div>
                  {a.url && (
                    <audio controls preload="none" src={a.url} className="w-full max-w-md">
                      <track kind="captions" />
                    </audio>
                  )}
                  {a.dipakai === 0 && <TombolHapusAudio ujianId={ujian.id} audioId={a.id} judul={a.judul} />}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
        <Kartu judul="Unggah audio">
          <UnggahAudio ujianId={ujian.id} />
        </Kartu>
      </div>
    </>
  );
}
