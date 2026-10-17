import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormUjian } from "@/components/ujian/form-ujian";
import { duplikatUjian } from "@/lib/aksi-ujian";
import { pilihanForm } from "@/lib/data/master";
import { ambilUjian } from "@/lib/data/ujian";
import { isoKeLokal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Duplikat ujian" };

export default function HalamanDuplikatUjian({ params }: PageProps<"/ujian/[id]/duplikat">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [ujian, { kelas }] = await Promise.all([ambilUjian(id), pilihanForm()]);
  if (!ujian) notFound();

  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}`} label={`Kembali ke ${ujian.judul}`} />
      <h1 className="text-2xl">Duplikat ujian</h1>
      <p className="-mt-3 text-sm text-muted-foreground">
        Menyalin {ujian.soal.length} soal (beserta kunci dan bobot) dan {ujian.audio.length} audio menjadi ujian baru berstatus
        draf. Ubah judul, kelas, dan waktunya di bawah.
      </p>
      <Kartu>
        <FormUjian
          aksi={duplikatUjian.bind(null, id)}
          kelas={kelas}
          labelTombol="Buat salinan"
          awal={{
            judul: `Salinan - ${ujian.judul}`.slice(0, 200),
            keterangan: ujian.keterangan,
            kelasId: ujian.kelas_id,
            mulai: isoKeLokal(ujian.mulai, ujian.zona),
            selesai: isoKeLokal(ujian.selesai, ujian.zona),
            durasiMenit: ujian.durasi_menit,
            acakSoal: ujian.acak_soal,
            acakOpsi: ujian.acak_opsi,
          }}
        />
      </Kartu>
    </div>
  );
}
