import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { daftarKelas } from "@/lib/data/master";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";

export const metadata: Metadata = { title: "Kelas" };

const DASAR = "/kelas";

export default function HalamanKelas({ searchParams }: PageProps<"/kelas">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Kelas" tombol={{ href: "/kelas/baru", label: "Tambah kelas" }} />
      <Suspense fallback={<Memuat />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const semua = await daftarKelas();

  const cari = param(sp, "q");
  const status = param(sp, "status");
  const urut = param(sp, "urut") === "peserta" ? "peserta" : "nama";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;

  const tersaring = semua
    .filter((k) => cocokCari(cari, k.nama, k.keterangan ?? ""))
    .filter((k) => !status || (status === "aktif") === k.aktif)
    .sort((a, b) => arah * (urut === "peserta" ? a.jumlahPeserta - b.jumlahPeserta : a.nama.localeCompare(b.nama, "id")));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));

  return (
    <Kartu>
      <FormFilter aksi={DASAR}>
        <div className="sm:w-64">
          <KolomIsian label="Cari kelas" name="q" type="search" defaultValue={cari} />
        </div>
        <KolomPilihan label="Status" name="status" defaultValue={status}>
          <option value="">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </KolomPilihan>
      </FormFilter>

      <div className="mt-6 hidden grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
        <JudulUrut label="Nama kelas" kolom="nama" dasar={DASAR} sp={sp} />
        <span>Keterangan</span>
        <JudulUrut label="Peserta" kolom="peserta" dasar={DASAR} sp={sp} />
        <span>Jadwal</span>
        <span>Status</span>
      </div>
      {hal.baris.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Tidak ada kelas yang cocok.</p>
      ) : (
        <ul className="divide-y">
          {hal.baris.map((k) => (
            <li key={k.id}>
              <Link
                href={`/kelas/${k.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[2fr_3fr_1fr_1fr_1fr]"
              >
                <span className="text-sm font-medium">{k.nama}</span>
                <span className="col-start-1 row-start-2 truncate text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
                  <span className="md:hidden">{k.jumlahPeserta} peserta · {k.jumlahJadwal} jadwal</span>
                  <span className="hidden md:inline">{k.keterangan ?? "–"}</span>
                </span>
                <span className="hidden text-sm md:block">{k.jumlahPeserta}</span>
                <span className="hidden text-sm md:block">{k.jumlahJadwal}</span>
                <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  <Chip warna={k.aktif ? "hijau" : "merah"}>{k.aktif ? "Aktif" : "Nonaktif"}</Chip>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Halaman nomor={hal.nomor} total={hal.total} jumlah={hal.jumlah} dasar={DASAR} sp={sp} />
    </Kartu>
  );
}
