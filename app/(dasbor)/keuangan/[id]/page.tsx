import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormKas, TombolHapus } from "@/components/keuangan/form-keuangan";
import { simpanKas } from "@/lib/aksi-keuangan";
import { waktuLembaga } from "@/lib/data/absensi";
import { ambilKas, pilihanKeuangan } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { formatTanggal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Ubah kas" };

export default function HalamanUbahKas({ params }: PageProps<"/keuangan/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/keuangan" label="Kembali ke kas" />
      <Suspense fallback={<Memuat />}>
        <Isi params={params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [kas, pilihan, waktu] = await Promise.all([ambilKas(id), pilihanKeuangan(), waktuLembaga()]);
  if (!kas) notFound();
  // Kategori yang kini nonaktif tetap muncul agar pilihan saat ini tidak hilang.
  const kategori =
    kas.kategori && !pilihan.kategori.some((k) => k.id === kas.kategori_id)
      ? [...pilihan.kategori, { id: kas.kategori.id, nama: kas.kategori.nama, jenis: kas.kategori.jenis, butuh_tutor: kas.kategori.butuh_tutor }]
      : pilihan.kategori;

  return (
    <>
      <h1 className="text-2xl">
        {kas.kategori?.nama} · {formatRupiah(kas.jumlah)}
      </h1>
      <p className="-mt-4 text-sm text-muted-foreground">{formatTanggal(kas.tanggal)}</p>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Data kas" className="xl:col-span-2">
          <FormKas
            aksi={simpanKas.bind(null, kas.id)}
            kategori={kategori}
            tutor={pilihan.tutor}
            tanggalAwal={waktu.tanggal}
            awal={{ tanggal: kas.tanggal, kategoriId: kas.kategori_id, keterangan: kas.keterangan, jumlah: kas.jumlah, tutorId: kas.tutor_id }}
          />
        </Kartu>
        <Kartu judul="Hapus">
          <p className="mb-4 text-sm text-muted-foreground">
            Data keuangan tidak dihapus permanen: disembunyikan dari daftar, rekap, saldo honor, dan ekspor, tetapi tetap ada di log audit.
          </p>
          <TombolHapus jenis="kas" id={kas.id} />
        </Kartu>
      </div>
    </>
  );
}
