import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat, TautanKembali } from "@/components/halaman";
import { FormPembayaran } from "@/components/keuangan/form-keuangan";
import { simpanPembayaran } from "@/lib/aksi-keuangan";
import { waktuLembaga } from "@/lib/data/absensi";
import { pilihanKeuangan } from "@/lib/data/keuangan";

export const metadata: Metadata = { title: "Catat pembayaran" };

export default function HalamanCatatPembayaran() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/pembayaran" label="Kembali ke pembayaran" />
      <KepalaHalaman judul="Catat pembayaran" />
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
  return <FormPembayaran aksi={simpanPembayaran.bind(null, null)} peserta={pilihan.peserta} tanggalAwal={waktu.tanggal} />;
}
