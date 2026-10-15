import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { FormKategori, TombolAktifKategori } from "@/components/keuangan/form-keuangan";
import { TabKeuangan } from "@/components/keuangan/tab-keuangan";
import { Chip } from "@/components/tabel";
import { tambahKategori } from "@/lib/aksi-keuangan";
import { daftarKategori } from "@/lib/data/keuangan";

export const metadata: Metadata = { title: "Kategori kas" };

export default function HalamanKategori() {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Keuangan" />
      <TabKeuangan />
      <Suspense fallback={<Memuat />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  const kategori = await daftarKategori();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Kartu judul="Kategori kas">
        <ul className="divide-y">
          {kategori.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{k.nama}</span>
                <Chip warna={k.jenis === "pemasukan" ? "hijau" : "kuning"}>
                  {k.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                </Chip>
                {k.butuh_tutor && <Chip warna="netral">Pilih tutor</Chip>}
                {k.otomatis && <Chip warna="netral">Otomatis dari Pembayaran</Chip>}
                {!k.aktif && <Chip warna="merah">Nonaktif</Chip>}
              </span>
              {!k.otomatis && <TombolAktifKategori id={k.id} aktif={k.aktif} nama={k.nama} />}
            </li>
          ))}
        </ul>
      </Kartu>
      <Kartu judul="Tambah kategori">
        <FormKategori aksi={tambahKategori} />
      </Kartu>
    </div>
  );
}
