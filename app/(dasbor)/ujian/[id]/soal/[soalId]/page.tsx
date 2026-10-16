import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormSoal } from "@/components/ujian/form-ujian";
import { simpanSoal } from "@/lib/aksi-ujian";
import { ambilUjian } from "@/lib/data/ujian";

export const metadata: Metadata = { title: "Ubah soal" };

export default function HalamanUbahSoal({ params }: PageProps<"/ujian/[id]/soal/[soalId]">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string; soalId: string }> }) {
  const { id, soalId } = await params;
  if (!z.guid().safeParse(id).success || !z.guid().safeParse(soalId).success) notFound();
  const ujian = await ambilUjian(id);
  const soal = ujian?.soal.find((s) => s.id === soalId);
  if (!ujian || !soal) notFound();

  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}#soal`} label={`Kembali ke ${ujian.judul}`} />
      <h1 className="text-2xl">Ubah soal nomor {soal.urutan}</h1>
      <Kartu>
        <FormSoal
          aksi={simpanSoal.bind(null, id, soal.id)}
          audio={ujian.audio.map((a) => ({ id: a.id, nama: a.judul }))}
          awal={{
            urutan: soal.urutan,
            jenis: soal.jenis,
            pertanyaan: soal.pertanyaan,
            opsi: soal.opsi ?? [],
            jawabanBenar: soal.kunci?.jawaban_benar ?? null,
            kunciIsian: soal.kunci?.kunci_isian ?? null,
            audioId: soal.audio_id,
            bobot: soal.bobot,
          }}
        />
      </Kartu>
    </div>
  );
}
