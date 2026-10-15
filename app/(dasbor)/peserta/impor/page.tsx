import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, TautanKembali } from "@/components/halaman";
import { ImporPeserta } from "@/components/master/impor-peserta";
import { wajibPeran } from "@/lib/auth";

export const metadata: Metadata = { title: "Impor peserta" };

export default function HalamanImporPeserta() {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/peserta" label="Kembali ke daftar peserta" />
      <KepalaHalaman judul="Impor peserta dari CSV" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Unggah berkas" className="xl:col-span-2">
          <Suspense fallback={null}>
            <Isi />
          </Suspense>
        </Kartu>
        <Kartu judul="Cara membuat berkas">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            <li>
              Unduh{" "}
              <a href="/ekspor/templat-peserta" className="font-medium text-accent hover:underline">
                templat CSV
              </a>{" "}
              atau buat sendiri di Excel/Google Sheets.
            </li>
            <li>
              Baris pertama berisi judul kolom: <code>nama</code> (wajib), <code>catatan</code> dan <code>kelas</code> (opsional).
            </li>
            <li>
              Isi <code>kelas</code> dengan nama kelas yang <strong>sudah ada</strong> di menu Kelas. Lebih dari satu kelas: pisahkan
              dengan tanda <code>|</code>, misalnya <code>Bahasa Arab Dasar|Nahwu Shorof</code>.
            </li>
            <li>Simpan sebagai CSV (koma atau titik koma), maksimal 1.000 baris.</li>
            <li>Nama yang sudah ada di daftar peserta akan dilewati agar tidak dobel.</li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Impor bersifat semua-atau-tidak-sama-sekali: bila gagal, tidak ada data yang tersimpan. Jangan isi catatan dengan hal
            sensitif.
          </p>
        </Kartu>
      </div>
    </div>
  );
}

async function Isi() {
  await wajibPeran("admin");
  return <ImporPeserta />;
}
