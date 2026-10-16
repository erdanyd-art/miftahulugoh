import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { ImporSoal } from "@/components/ujian/impor-soal";
import { ambilUjian } from "@/lib/data/ujian";

export const metadata: Metadata = { title: "Impor soal" };

export default function HalamanImporSoal({ params }: PageProps<"/ujian/[id]/impor">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const ujian = await ambilUjian(id); // memeriksa peran admin
  if (!ujian) notFound();

  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}#soal`} label={`Kembali ke ${ujian.judul}`} />
      <h1 className="text-2xl">Impor soal dari CSV</h1>
      <Kartu judul="Cara menyiapkan berkas">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
          <li>
            <a href="/ekspor/templat-soal" className="font-medium text-accent hover:underline">
              Unduh templat CSV
            </a>{" "}
            lalu buka di Excel atau Google Sheets. Hapus baris contoh.
          </li>
          <li>
            Satu baris = satu soal. <strong>jenis</strong>: <code>pg</code> atau <code>isian</code>. Pilihan ganda: isi kolom{" "}
            <strong>a</strong>, <strong>b</strong>, … (minimal 2) dan <strong>kunci</strong> berupa huruf (A–F). Isian: isi{" "}
            <strong>acuan</strong> bila perlu.
          </li>
          <li>
            <strong>nomor</strong> dan <strong>bobot</strong> boleh kosong (nomor melanjutkan soal terakhir, bobot 1).{" "}
            <strong>audio</strong>: judul audio yang sudah diunggah di ujian ini
            {ujian.audio.length ? ` (${ujian.audio.map((a) => a.judul).join(", ")})` : " (belum ada)"}.
          </li>
          <li>
            Simpan sebagai <strong>CSV UTF-8</strong> agar huruf Arab tidak rusak (Excel: Simpan Sebagai → CSV UTF-8; Google
            Sheets: File → Download → CSV).
          </li>
        </ol>
      </Kartu>
      <Kartu>
        {ujian.percobaan.mulai > 0 ? (
          <p className="text-sm text-muted-foreground">Ujian sudah dikerjakan peserta; soal tidak bisa ditambah.</p>
        ) : (
          <ImporSoal ujianId={id} />
        )}
      </Kartu>
    </div>
  );
}
