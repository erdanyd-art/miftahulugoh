import type { Metadata } from "next";
import { Suspense } from "react";
import { FormPengaturan } from "@/components/pengguna/form-pengguna";
import { ambilPengaturan } from "@/lib/data/pengguna";

export const metadata: Metadata = { title: "Pengaturan" };

export default function HalamanPengaturan() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>
      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <Isi />
        </Suspense>
      </section>
    </div>
  );
}

async function Isi() {
  const pengaturan = await ambilPengaturan();
  return <FormPengaturan namaLembaga={pengaturan.nama_lembaga} zonaWaktu={pengaturan.zona_waktu} />;
}
