import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat, PESAN_UMUM } from "@/components/halaman";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { waktuLembaga } from "@/lib/data/absensi";
import { daftarPembayaran } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";
import { bulanValid, formatTanggal, namaBulan, rentangBulan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Pembayaran" };

const DASAR = "/pembayaran";

export default function HalamanPembayaran({ searchParams }: PageProps<"/pembayaran">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Pembayaran peserta" tombol={{ href: "/pembayaran/baru", label: "Catat pembayaran" }} />
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
  const semua = await daftarPembayaran(dari, sampai);

  const cari = param(sp, "q");
  const status = param(sp, "status");
  const peserta = param(sp, "peserta");
  const urut = param(sp, "urut") === "jumlah" ? "jumlah" : "tanggal";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;
  const pilihanPeserta = [...new Map(semua.flatMap((p) => (p.peserta ? [p.peserta] : [])).map((p) => [p.id, p])).values()].sort(
    (a, b) => a.nama.localeCompare(b.nama, "id"),
  );
  const tersaring = semua
    .filter((p) => cocokCari(cari, p.peserta?.nama ?? "", p.keterangan))
    .filter((p) => !status || p.status === status)
    .filter((p) => !peserta || p.peserta_id === peserta)
    .sort((a, b) => arah * (urut === "jumlah" ? a.jumlah - b.jumlah : a.tanggal.localeCompare(b.tanggal)));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));
  const lunas = semua.filter((p) => p.status === "lunas").reduce((n, p) => n + p.jumlah, 0);
  const belum = semua.filter((p) => p.status === "belum_lunas");
  const pesan = PESAN_UMUM[param(sp, "pesan")];

  return (
    <>
      {pesan && <PesanStatus pesan={pesan} />}
      <section aria-label={`Ringkasan pembayaran ${namaBulan(bulan)}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-3xl bg-pastel-kuning p-5">
          <p className="font-judul text-lg">Lunas {namaBulan(bulan)}</p>
          <p className="font-judul text-3xl">{formatRupiah(lunas)}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-3xl bg-pastel-pink p-5">
          <p className="font-judul text-lg">Belum lunas {namaBulan(bulan)}</p>
          <p className="font-judul text-3xl">{formatRupiah(belum.reduce((n, p) => n + p.jumlah, 0))}</p>
          <p className="text-xs text-pastel-muted">{belum.length} catatan</p>
        </div>
      </section>

      <Kartu>
        <div className="mb-4 flex justify-end">
          <a href={`/ekspor/pembayaran?bulan=${bulan}`} className="text-sm font-medium text-accent hover:underline">
            Ekspor CSV {namaBulan(bulan)}
          </a>
        </div>
        <FormFilter aksi={DASAR}>
          <KolomIsian label="Bulan" name="bulan" type="month" defaultValue={bulan} />
          <div className="sm:w-56">
            <KolomIsian label="Cari peserta atau keterangan" name="q" type="search" defaultValue={cari} />
          </div>
          <KolomPilihan label="Peserta" name="peserta" defaultValue={peserta}>
            <option value="">Semua</option>
            {pilihanPeserta.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </KolomPilihan>
          <KolomPilihan label="Status" name="status" defaultValue={status}>
            <option value="">Semua</option>
            <option value="lunas">Lunas</option>
            <option value="belum_lunas">Belum Lunas</option>
          </KolomPilihan>
        </FormFilter>

        <div className="mt-6 hidden grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
          <JudulUrut label="Tanggal" kolom="tanggal" dasar={DASAR} sp={sp} />
          <span>Peserta</span>
          <span>Keterangan</span>
          <JudulUrut label="Jumlah" kolom="jumlah" dasar={DASAR} sp={sp} />
          <span>Status</span>
        </div>
        {hal.baris.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Tidak ada pembayaran yang cocok.</p>
        ) : (
          <ul className="divide-y">
            {hal.baris.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pembayaran/${p.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[1fr_2fr_2fr_1fr_1fr]"
                >
                  <span className="text-sm">
                    <span className="md:hidden font-medium">{p.peserta?.nama} · </span>
                    {formatTanggal(p.tanggal)}
                  </span>
                  <span className="hidden text-sm font-medium md:block">{p.peserta?.nama}</span>
                  <span className="col-start-1 row-start-2 truncate text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
                    {p.keterangan}
                    <span className="md:hidden"> · {formatRupiah(p.jumlah)}</span>
                  </span>
                  <span className="hidden text-sm md:block">{formatRupiah(p.jumlah)}</span>
                  <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                    <Chip warna={p.status === "lunas" ? "hijau" : "merah"}>{p.status === "lunas" ? "Lunas" : "Belum Lunas"}</Chip>
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
