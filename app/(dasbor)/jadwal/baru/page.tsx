import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat, TautanKembali } from "@/components/halaman";
import { FormJadwal } from "@/components/master/form-master";
import { simpanJadwal } from "@/lib/aksi-master";
import { pilihanForm } from "@/lib/data/master";

export const metadata: Metadata = { title: "Tambah jadwal" };

export default function HalamanTambahJadwal() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/jadwal" label="Kembali ke daftar jadwal" />
      <KepalaHalaman judul="Tambah jadwal" />
      <Kartu>
        <Suspense fallback={<Memuat />}>
          <Isi />
        </Suspense>
      </Kartu>
    </div>
  );
}

async function Isi() {
  const pilihan = await pilihanForm();
  if (pilihan.kelas.length === 0 || pilihan.tutor.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Butuh minimal satu kelas aktif dan satu tutor aktif sebelum membuat jadwal.
      </p>
    );
  }
  return <FormJadwal aksi={simpanJadwal.bind(null, null)} kelas={pilihan.kelas} tutor={pilihan.tutor} />;
}
