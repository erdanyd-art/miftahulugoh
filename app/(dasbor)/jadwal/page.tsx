import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { daftarJadwal } from "@/lib/data/master";
import { DAFTAR_HARI, formatJam, formatRupiah, namaHari } from "@/lib/format";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";

export const metadata: Metadata = { title: "Jadwal" };

const DASAR = "/jadwal";

export default function HalamanJadwal({ searchParams }: PageProps<"/jadwal">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Jadwal" tombol={{ href: "/jadwal/baru", label: "Tambah jadwal" }} />
      <Suspense fallback={<Memuat />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const semua = await daftarJadwal();

  const cari = param(sp, "q");
  const hari = param(sp, "hari");
  const tutor = param(sp, "tutor");
  const status = param(sp, "status");
  const urut = ["kelas", "tutor", "honor"].includes(param(sp, "urut")) ? param(sp, "urut") : "hari";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;
  const semuaTutor = [...new Map(semua.flatMap((j) => (j.tutor ? [j.tutor] : [])).map((t) => [t.id, t])).values()].sort(
    (a, b) => a.nama.localeCompare(b.nama, "id"),
  );

  const banding = (a: (typeof semua)[number], b: (typeof semua)[number]) => {
    if (urut === "kelas") return (a.kelas?.nama ?? "").localeCompare(b.kelas?.nama ?? "", "id");
    if (urut === "tutor") return (a.tutor?.nama ?? "").localeCompare(b.tutor?.nama ?? "", "id");
    if (urut === "honor") return a.honor - b.honor;
    return a.hari - b.hari || a.jam_mulai.localeCompare(b.jam_mulai);
  };
  const tersaring = semua
    .filter((j) => cocokCari(cari, j.kelas?.nama ?? "", j.tutor?.nama ?? ""))
    .filter((j) => !hari || j.hari === Number(hari))
    .filter((j) => !tutor || j.tutor_id === tutor)
    .filter((j) => !status || (status === "aktif") === j.aktif)
    .sort((a, b) => arah * banding(a, b));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));

  return (
    <Kartu>
      <FormFilter aksi={DASAR}>
        <div className="sm:w-56">
          <KolomIsian label="Cari kelas atau tutor" name="q" type="search" defaultValue={cari} />
        </div>
        <KolomPilihan label="Hari" name="hari" defaultValue={hari}>
          <option value="">Semua</option>
          {DAFTAR_HARI.map((h) => (
            <option key={h} value={h}>
              {namaHari(h)}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Tutor" name="tutor" defaultValue={tutor}>
          <option value="">Semua</option>
          {semuaTutor.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Status" name="status" defaultValue={status}>
          <option value="">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </KolomPilihan>
      </FormFilter>

      <div className="mt-6 hidden grid-cols-[1fr_1fr_2fr_2fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
        <JudulUrut label="Hari" kolom="hari" dasar={DASAR} sp={sp} />
        <span>Jam</span>
        <JudulUrut label="Kelas" kolom="kelas" dasar={DASAR} sp={sp} />
        <JudulUrut label="Tutor" kolom="tutor" dasar={DASAR} sp={sp} />
        <JudulUrut label="Honor" kolom="honor" dasar={DASAR} sp={sp} />
        <span>Status</span>
      </div>
      {hal.baris.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Tidak ada jadwal yang cocok.</p>
      ) : (
        <ul className="divide-y">
          {hal.baris.map((j) => (
            <li key={j.id}>
              <Link
                href={`/jadwal/${j.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[1fr_1fr_2fr_2fr_1fr_1fr]"
              >
                <span className="text-sm font-medium md:font-normal">
                  {namaHari(j.hari)}
                  <span className="md:hidden">
                    , {formatJam(j.jam_mulai)}–{formatJam(j.jam_selesai)} · {j.kelas?.nama}
                  </span>
                </span>
                <span className="hidden text-sm md:block">
                  {formatJam(j.jam_mulai)}–{formatJam(j.jam_selesai)}
                </span>
                <span className="hidden text-sm font-medium md:block">{j.kelas?.nama}</span>
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm md:text-foreground">
                  {j.tutor?.nama}
                  <span className="md:hidden"> · {formatRupiah(j.honor)}</span>
                </span>
                <span className="hidden text-sm md:block">{formatRupiah(j.honor)}</span>
                <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  <Chip warna={j.aktif ? "hijau" : "merah"}>{j.aktif ? "Aktif" : "Nonaktif"}</Chip>
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
