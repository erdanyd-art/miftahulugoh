import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat, PESAN_UMUM } from "@/components/halaman";
import { FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { ChipStatusUjian, statusUjian } from "@/components/ujian/status-ujian";
import { daftarUjian } from "@/lib/data/ujian";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";
import { formatWaktu } from "@/lib/waktu";

export const metadata: Metadata = { title: "Ujian" };

const DASAR = "/ujian";

export default function HalamanUjian({ searchParams }: PageProps<"/ujian">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Ujian" tombol={{ href: "/ujian/baru", label: "Buat ujian" }} />
      <Suspense fallback={<Memuat />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  await connection(); // status (terjadwal/berlangsung) bergantung pada jam saat ini
  const sp = await searchParams;
  const { zona, ujian } = await daftarUjian();
  const pesan = PESAN_UMUM[param(sp, "pesan")];

  const cari = param(sp, "q");
  const status = param(sp, "status");
  const urut = ["judul", "kelas"].includes(param(sp, "urut")) ? param(sp, "urut") : "mulai";
  const arah = param(sp, "arah") === "naik" ? 1 : -1;
  const banding = (a: (typeof ujian)[number], b: (typeof ujian)[number]) => {
    if (urut === "judul") return a.judul.localeCompare(b.judul, "id");
    if (urut === "kelas") return (a.kelas?.nama ?? "").localeCompare(b.kelas?.nama ?? "", "id");
    return a.mulai.localeCompare(b.mulai);
  };
  const tersaring = ujian
    .filter((u) => cocokCari(cari, u.judul, u.kelas?.nama ?? ""))
    .filter((u) => !status || statusUjian(u).label.toLowerCase() === status)
    .sort((a, b) => arah * banding(a, b));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));

  return (
    <Kartu>
      {pesan && (
        <div className="mb-4">
          <PesanStatus pesan={pesan} />
        </div>
      )}
      <FormFilter aksi={DASAR}>
        <div className="sm:w-56">
          <KolomIsian label="Cari judul atau kelas" name="q" type="search" defaultValue={cari} />
        </div>
        <KolomPilihan label="Status" name="status" defaultValue={status}>
          <option value="">Semua</option>
          <option value="draf">Draf</option>
          <option value="terjadwal">Terjadwal</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="selesai">Selesai</option>
        </KolomPilihan>
      </FormFilter>

      <div className="mt-6 hidden grid-cols-[3fr_2fr_3fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
        <JudulUrut label="Judul" kolom="judul" dasar={DASAR} sp={sp} />
        <JudulUrut label="Kelas" kolom="kelas" dasar={DASAR} sp={sp} />
        <JudulUrut label="Dibuka" kolom="mulai" dasar={DASAR} sp={sp} />
        <span>Soal</span>
        <span>Status</span>
      </div>
      {hal.baris.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Belum ada ujian yang cocok.</p>
      ) : (
        <ul className="divide-y">
          {hal.baris.map((u) => (
            <li key={u.id}>
              <Link
                href={`/ujian/${u.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[3fr_2fr_3fr_1fr_1fr]"
              >
                <span className="text-sm font-medium" dir="auto">
                  {u.judul}
                </span>
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm md:text-foreground">
                  {u.kelas?.nama}
                  <span className="md:hidden"> · {formatWaktu(u.mulai, zona)}</span>
                </span>
                <span className="hidden text-sm md:block">
                  {formatWaktu(u.mulai, zona)} – {formatWaktu(u.selesai, zona)}
                </span>
                <span className="hidden text-sm md:block">{u.jumlahSoal}</span>
                <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  <ChipStatusUjian ujian={u} />
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
