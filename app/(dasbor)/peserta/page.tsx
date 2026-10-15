import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { daftarPeserta } from "@/lib/data/master";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";

export const metadata: Metadata = { title: "Peserta" };

const DASAR = "/peserta";

export default function HalamanPeserta({ searchParams }: PageProps<"/peserta">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman
        judul="Peserta"
        tombol={{ href: "/peserta/baru", label: "Tambah peserta" }}
        tombolKedua={{ href: "/peserta/impor", label: "Impor CSV" }}
      />
      <Suspense fallback={<Memuat />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const semua = await daftarPeserta();

  const cari = param(sp, "q");
  const status = param(sp, "status");
  const kelas = param(sp, "kelas");
  const urut = param(sp, "urut") === "dibuat" ? "dibuat" : "nama";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;
  const semuaKelas = [...new Map(semua.flatMap((p) => p.kelas).map((k) => [k.id, k])).values()].sort((a, b) =>
    a.nama.localeCompare(b.nama, "id"),
  );

  const tersaring = semua
    .filter((p) => cocokCari(cari, p.nama))
    .filter((p) => !status || (status === "aktif") === p.aktif)
    .filter((p) => !kelas || p.kelas.some((k) => k.id === kelas))
    .sort((a, b) => arah * (urut === "dibuat" ? a.dibuat_pada.localeCompare(b.dibuat_pada) : a.nama.localeCompare(b.nama, "id")));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));

  return (
    <Kartu>
      <FormFilter aksi={DASAR}>
        <div className="sm:w-64">
          <KolomIsian label="Cari nama" name="q" type="search" defaultValue={cari} />
        </div>
        <KolomPilihan label="Kelas" name="kelas" defaultValue={kelas}>
          <option value="">Semua</option>
          {semuaKelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Status" name="status" defaultValue={status}>
          <option value="">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </KolomPilihan>
      </FormFilter>

      <div className="mt-6 hidden grid-cols-[2fr_3fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
        <JudulUrut label="Nama" kolom="nama" dasar={DASAR} sp={sp} />
        <span>Kelas</span>
        <span>Status</span>
        <JudulUrut label="Ditambahkan" kolom="dibuat" dasar={DASAR} sp={sp} />
      </div>
      {hal.baris.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Tidak ada peserta yang cocok.</p>
      ) : (
        <ul className="divide-y">
          {hal.baris.map((p) => (
            <li key={p.id}>
              <Link
                href={`/peserta/${p.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[2fr_3fr_1fr_1fr]"
              >
                <span className="text-sm font-medium">{p.nama}</span>
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
                  {p.kelas.length ? p.kelas.map((k) => k.nama).join(", ") : "Belum ada kelas"}
                </span>
                <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  <Chip warna={p.aktif ? "hijau" : "merah"}>{p.aktif ? "Aktif" : "Nonaktif"}</Chip>
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {new Date(p.dibuat_pada).toLocaleDateString("id-ID", { dateStyle: "medium" })}
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
