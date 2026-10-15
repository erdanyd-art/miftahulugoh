import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat, TautanKembali } from "@/components/halaman";
import { FormKas } from "@/components/keuangan/form-keuangan";
import { simpanKas } from "@/lib/aksi-keuangan";
import { waktuLembaga } from "@/lib/data/absensi";
import { pilihanKeuangan } from "@/lib/data/keuangan";

export const metadata: Metadata = { title: "Catat kas" };

export default function HalamanCatatKas() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/keuangan" label="Kembali ke kas" />
      <KepalaHalaman judul="Catat kas" />
      <Kartu>
        <Suspense fallback={<Memuat />}>
          <Isi />
        </Suspense>
      </Kartu>
    </div>
  );
}

async function Isi() {
  const [pilihan, waktu] = await Promise.all([pilihanKeuangan(), waktuLembaga()]);
  return (
    <FormKas aksi={simpanKas.bind(null, null)} kategori={pilihan.kategori} tutor={pilihan.tutor} tanggalAwal={waktu.tanggal} />
  );
}
