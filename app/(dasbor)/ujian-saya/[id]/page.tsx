import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { LABEL_STATUS } from "@/components/dashboard/dashboard-peserta";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { Kerjakan, TombolMulai } from "@/components/ujian/kerjakan";
import { ambilUjianSaya } from "@/lib/data/ujian-peserta";
import { formatWaktu } from "@/lib/waktu";

export const metadata: Metadata = { title: "Ujian" };

export default function HalamanUjianSaya({ params }: PageProps<"/ujian-saya/[id]">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const data = await ambilUjianSaya(id);
  if (!data) notFound();
  const { zona, ujian, pengerjaan } = data;

  if (pengerjaan) {
    return (
      <Kerjakan
        key={pengerjaan.percobaanId}
        percobaanId={pengerjaan.percobaanId}
        judul={ujian.judul}
        sisaMs={pengerjaan.sisaMs}
        soal={pengerjaan.soal}
        jawabanAwal={pengerjaan.jawaban}
      />
    );
  }

  const s = LABEL_STATUS[ujian.status];
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/" label="Kembali ke beranda" />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl" dir="auto">
          {ujian.judul}
        </h1>
        <Chip warna={s.warna}>{s.label}</Chip>
      </div>
      <Kartu>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Kelas</dt>
          <dd>{ujian.kelas}</dd>
          <dt className="text-muted-foreground">Dibuka</dt>
          <dd>
            {formatWaktu(ujian.mulai, zona)} – {formatWaktu(ujian.selesai, zona)}
          </dd>
          <dt className="text-muted-foreground">Durasi</dt>
          <dd>{ujian.durasi_menit} menit</dd>
          <dt className="text-muted-foreground">Jumlah soal</dt>
          <dd>{ujian.jumlah_soal}</dd>
        </dl>
        {ujian.keterangan && (
          <p className="mt-4 rounded-2xl bg-secondary p-4 text-sm whitespace-pre-wrap" dir="auto">
            {ujian.keterangan}
          </p>
        )}
        <div className="mt-6">
          {ujian.status === "dibuka" && (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Waktu berjalan sejak Anda menekan Mulai, dan berhenti saat durasi habis atau ujian ditutup, mana yang lebih
                dulu. Jawaban tersimpan otomatis. Kesempatan hanya satu kali.
              </p>
              <TombolMulai ujianId={ujian.id} durasi={ujian.durasi_menit} />
            </>
          )}
          {ujian.status === "terjadwal" && (
            <p className="text-sm">Ujian belum dibuka. Kembali lagi pada {formatWaktu(ujian.mulai, zona)}.</p>
          )}
          {ujian.status === "selesai" &&
            (ujian.nilai ? (
              <div className="flex flex-col items-start gap-1 rounded-2xl bg-pastel-kuning p-5">
                <span className="text-sm text-pastel-muted">Nilai Anda</span>
                <span className="font-judul text-5xl">{String(ujian.nilai.nilai ?? 0).replace(".", ",")}</span>
                <span className="text-sm text-pastel-muted">
                  Skor {ujian.nilai.skor} dari {ujian.nilai.total_bobot}
                </span>
              </div>
            ) : (
              <p className="rounded-2xl bg-status-lunas p-4 text-sm text-status-lunas-foreground">
                Ujian selesai dan jawaban Anda sudah tersimpan. Nilai akan tampil setelah diumumkan admin.
              </p>
            ))}
          {ujian.status === "terlewat" && <p className="text-sm">Ujian sudah ditutup dan Anda tidak mengerjakannya.</p>}
        </div>
      </Kartu>
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        Lihat semua ujian
      </Link>
    </div>
  );
}
