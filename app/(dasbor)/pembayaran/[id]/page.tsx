import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { FormPembayaran, TombolHapus } from "@/components/keuangan/form-keuangan";
import { Chip } from "@/components/tabel";
import { simpanPembayaran } from "@/lib/aksi-keuangan";
import { waktuLembaga } from "@/lib/data/absensi";
import { ambilPembayaran, pilihanKeuangan } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { formatTanggal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Ubah pembayaran" };

export default function HalamanUbahPembayaran({ params }: PageProps<"/pembayaran/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/pembayaran" label="Kembali ke pembayaran" />
      <Suspense fallback={<Memuat />}>
        <Isi params={params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [bayar, pilihan, waktu] = await Promise.all([ambilPembayaran(id), pilihanKeuangan(), waktuLembaga()]);
  if (!bayar) notFound();
  // Peserta yang kini nonaktif tetap muncul agar pilihan saat ini tidak hilang.
  const peserta =
    bayar.peserta && !pilihan.peserta.some((p) => p.id === bayar.peserta_id) ? [...pilihan.peserta, bayar.peserta] : pilihan.peserta;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">
          {bayar.peserta?.nama} · {formatRupiah(bayar.jumlah)}
        </h1>
        <Chip warna={bayar.status === "lunas" ? "hijau" : "merah"}>{bayar.status === "lunas" ? "Lunas" : "Belum Lunas"}</Chip>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">
        {bayar.keterangan} · {formatTanggal(bayar.tanggal)}
      </p>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Data pembayaran" className="xl:col-span-2">
          <FormPembayaran
            aksi={simpanPembayaran.bind(null, bayar.id)}
            peserta={peserta}
            tanggalAwal={waktu.tanggal}
            awal={{ tanggal: bayar.tanggal, pesertaId: bayar.peserta_id, keterangan: bayar.keterangan, jumlah: bayar.jumlah, status: bayar.status }}
          />
        </Kartu>
        <Kartu judul="Hapus">
          <p className="mb-4 text-sm text-muted-foreground">
            Tidak dihapus permanen: disembunyikan dari daftar, rekap, dan ekspor, tetapi tetap ada di log audit.
          </p>
          <TombolHapus jenis="pembayaran" id={bayar.id} />
        </Kartu>
      </div>
    </>
  );
}
