import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormUjian } from "@/components/ujian/form-ujian";
import { simpanUjian } from "@/lib/aksi-ujian";
import { pilihanForm } from "@/lib/data/master";

export const metadata: Metadata = { title: "Buat ujian" };

export default function HalamanUjianBaru() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/ujian" label="Kembali ke daftar ujian" />
      <h1 className="text-2xl">Buat ujian</h1>
      <Kartu>
        <Suspense fallback={<Memuat />}>
          <Isi />
        </Suspense>
      </Kartu>
    </div>
  );
}

async function Isi() {
  const { kelas } = await pilihanForm();
  return <FormUjian aksi={simpanUjian.bind(null, null)} kelas={kelas} />;
}
