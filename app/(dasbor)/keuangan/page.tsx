import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat, PESAN_UMUM } from "@/components/halaman";
import { TabKeuangan } from "@/components/keuangan/tab-keuangan";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { waktuLembaga } from "@/lib/data/absensi";
import { daftarKas, daftarKategori } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";
import { bulanValid, formatTanggal, namaBulan, rentangBulan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Keuangan" };

const DASAR = "/keuangan";

export default function HalamanKeuangan({ searchParams }: PageProps<"/keuangan">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Keuangan" tombol={{ href: "/keuangan/baru", label: "Catat kas" }} />
      <TabKeuangan />
      <Suspense fallback={<Memuat />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const waktu = await waktuLembaga();
  const bulan = bulanValid(param(sp, "bulan")) ? param(sp, "bulan") : waktu.bulan;
  const { dari, sampai } = rentangBulan(bulan);
  const [semua, kategori] = await Promise.all([daftarKas(dari, sampai), daftarKategori()]);

  const cari = param(sp, "q");
  const jenis = param(sp, "jenis");
  const kategoriId = param(sp, "kategori");
  const urut = param(sp, "urut") === "jumlah" ? "jumlah" : "tanggal";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;
  const tersaring = semua
    .filter((k) => cocokCari(cari, k.keterangan ?? "", k.kategori?.nama ?? "", k.tutor?.nama ?? ""))
    .filter((k) => !jenis || k.jenis === jenis)
    .filter((k) => !kategoriId || k.kategori_id === kategoriId)
    .sort((a, b) => arah * (urut === "jumlah" ? a.jumlah - b.jumlah : a.tanggal.localeCompare(b.tanggal)));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));
  const masuk = semua.filter((k) => k.jenis === "pemasukan").reduce((n, k) => n + k.jumlah, 0);
  const keluar = semua.filter((k) => k.jenis === "pengeluaran").reduce((n, k) => n + k.jumlah, 0);
  const pesan = PESAN_UMUM[param(sp, "pesan")];

  return (
    <>
      {pesan && <PesanStatus pesan={pesan} />}
      <section aria-label={`Ringkasan kas ${namaBulan(bulan)}`} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Pemasukan", nilai: masuk, warna: "bg-pastel-kuning" },
          { label: "Pengeluaran", nilai: keluar, warna: "bg-pastel-ungu" },
          { label: "Selisih", nilai: masuk - keluar, warna: "bg-pastel-biru" },
        ].map((k) => (
          <div key={k.label} className={`flex flex-col gap-2 rounded-3xl p-5 ${k.warna}`}>
            <p className="font-judul text-lg">
              {k.label} {namaBulan(bulan)}
            </p>
            <p className="font-judul text-3xl">{formatRupiah(k.nilai)}</p>
          </div>
        ))}
      </section>

      <Kartu>
        <div className="mb-4 flex justify-end">
          <a href={`/ekspor/kas?bulan=${bulan}`} className="text-sm font-medium text-accent hover:underline">
            Ekspor CSV {namaBulan(bulan)}
          </a>
        </div>
        <FormFilter aksi={DASAR}>
          <KolomIsian label="Bulan" name="bulan" type="month" defaultValue={bulan} />
          <div className="sm:w-56">
            <KolomIsian label="Cari keterangan" name="q" type="search" defaultValue={cari} />
          </div>
          <KolomPilihan label="Jenis" name="jenis" defaultValue={jenis}>
            <option value="">Semua</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </KolomPilihan>
          <KolomPilihan label="Kategori" name="kategori" defaultValue={kategoriId}>
            <option value="">Semua</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </KolomPilihan>
        </FormFilter>

        <div className="mt-6 hidden grid-cols-[1fr_1.5fr_2.5fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
          <JudulUrut label="Tanggal" kolom="tanggal" dasar={DASAR} sp={sp} />
          <span>Kategori</span>
          <span>Keterangan</span>
          <span>Jenis</span>
          <JudulUrut label="Jumlah" kolom="jumlah" dasar={DASAR} sp={sp} />
        </div>
        {hal.baris.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Tidak ada catatan kas yang cocok.</p>
        ) : (
          <ul className="divide-y">
            {hal.baris.map((k) => (
              <li key={k.id}>
                <Link
                  href={`/keuangan/${k.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[1fr_1.5fr_2.5fr_1fr_1fr]"
                >
                  <span className="text-sm md:order-none">
                    {formatTanggal(k.tanggal)}
                    <span className="md:hidden"> · {k.kategori?.nama}</span>
                  </span>
                  <span className="hidden text-sm font-medium md:block">{k.kategori?.nama}</span>
                  <span className="col-start-1 row-start-2 truncate text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
                    {[k.keterangan, k.tutor ? `Tutor: ${k.tutor.nama}` : null].filter(Boolean).join(" · ") || "–"}
                  </span>
                  <span className="hidden md:block">
                    <Chip warna={k.jenis === "pemasukan" ? "hijau" : "kuning"}>
                      {k.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    </Chip>
                  </span>
                  <span className="col-start-2 row-span-2 row-start-1 text-right text-sm font-medium md:col-start-auto md:row-span-1 md:row-start-auto md:text-left">
                    {k.jenis === "pengeluaran" ? "−" : "+"}
                    {formatRupiah(k.jumlah)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Halaman nomor={hal.nomor} total={hal.total} jumlah={hal.jumlah} dasar={DASAR} sp={sp} />
      </Kartu>
    </>
  );
}
