import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, TautanKembali } from "@/components/halaman";
import { FormKelas } from "@/components/master/form-master";
import { simpanKelas } from "@/lib/aksi-master";
import { wajibPeran } from "@/lib/auth";

export const metadata: Metadata = { title: "Tambah kelas" };

export default function HalamanTambahKelas() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/kelas" label="Kembali ke daftar kelas" />
      <KepalaHalaman judul="Tambah kelas" />
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
  return <FormKelas aksi={simpanKelas.bind(null, null)} />;
}
