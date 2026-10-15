import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, TautanKembali } from "@/components/halaman";
import { FormPeserta } from "@/components/master/form-master";
import { simpanPeserta } from "@/lib/aksi-master";
import { wajibPeran } from "@/lib/auth";

export const metadata: Metadata = { title: "Tambah peserta" };

export default function HalamanTambahPeserta() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/peserta" label="Kembali ke daftar peserta" />
      <KepalaHalaman judul="Tambah peserta" />
      <Kartu>
        <Suspense fallback={null}>
          <Isi />
        </Suspense>
      </Kartu>
    </div>
  );
}

async function Isi() {
  await wajibPeran("admin");
  return <FormPeserta aksi={simpanPeserta.bind(null, null)} />;
}
