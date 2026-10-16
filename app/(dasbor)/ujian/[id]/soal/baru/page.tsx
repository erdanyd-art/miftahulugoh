import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormSoal } from "@/components/ujian/form-ujian";
import { simpanSoal } from "@/lib/aksi-ujian";
import { ambilUjian } from "@/lib/data/ujian";

export const metadata: Metadata = { title: "Tambah soal" };

export default function HalamanSoalBaru({ params }: PageProps<"/ujian/[id]/soal/baru">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const ujian = await ambilUjian(id);
  if (!ujian) notFound();
  const nomorBerikut = Math.min(500, ujian.soal.reduce((n, s) => Math.max(n, s.urutan), 0) + 1);

  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}#soal`} label={`Kembali ke ${ujian.judul}`} />
      <h1 className="text-2xl">Tambah soal</h1>
      <Kartu>
        <FormSoal
          aksi={simpanSoal.bind(null, id, null)}
          audio={ujian.audio.map((a) => ({ id: a.id, nama: a.judul }))}
          awal={{
            urutan: nomorBerikut,
            jenis: "pilihan_ganda",
            pertanyaan: "",
            opsi: [],
            jawabanBenar: null,
            kunciIsian: null,
            audioId: null,
            bobot: 1,
          }}
        />
      </Kartu>
    </div>
  );
}
