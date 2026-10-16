import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FormAbsen } from "@/components/absensi/form-absensi";
import { KolomIsian } from "@/components/form";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { simpanAbsensi } from "@/lib/aksi-absensi";
import { penggunaStaf } from "@/lib/auth";
import { dataFormAbsen, waktuLembaga } from "@/lib/data/absensi";
import { formatJam, formatRupiah, namaHari } from "@/lib/format";
import { param } from "@/lib/tabel";
import { formatTanggal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Isi absensi" };

export default function HalamanIsiAbsensi({ params, searchParams }: PageProps<"/absensi/isi/[jadwalId]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/absensi" label="Kembali ke absensi" />
      <Suspense fallback={<Memuat />}>
        <Isi params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: Promise<{ jadwalId: string }>;
  searchParams: PageProps<"/absensi/isi/[jadwalId]">["searchParams"];
}) {
  const pengguna = await penggunaStaf();
  const admin = pengguna.peran === "admin";
  const { jadwalId } = await params;
  if (!z.guid().safeParse(jadwalId).success) notFound();
  const waktu = await waktuLembaga();

  // Tutor selalu hari ini; admin boleh memilih tanggal lampau untuk koreksi (database menolak tanggal yang belum tiba).
  const diminta = param(await searchParams, "tanggal");
  const tanggal = admin && z.iso.date().safeParse(diminta).success && diminta <= waktu.tanggal ? diminta : waktu.tanggal;

  const data = await dataFormAbsen(jadwalId, tanggal);
  if (!data) notFound();
  const { jadwal, peserta, sesi, hadir } = data;
  const hariCocok = new Date(`${tanggal}T00:00:00Z`).getUTCDay() === jadwal.hari % 7;
  const belumMulai = tanggal === waktu.tanggal && jadwal.jam_mulai.slice(0, 5) > waktu.jam;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">Absensi {jadwal.kelas?.nama}</h1>
        <p className="text-sm text-muted-foreground">
          {namaHari(jadwal.hari)}, {formatJam(jadwal.jam_mulai)}–{formatJam(jadwal.jam_selesai)} · {jadwal.tutor?.nama} ·{" "}
          <span className="font-medium text-foreground">{formatTanggal(tanggal)}</span>
        </p>
      </div>

      {admin && (
        <Kartu>
          <form action={`/absensi/isi/${jadwal.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <KolomIsian label="Tanggal sesi (koreksi admin)" name="tanggal" type="date" max={waktu.tanggal} defaultValue={tanggal} />
            <button type="submit" className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
              Ganti tanggal
            </button>
          </form>
        </Kartu>
      )}

      {!hariCocok && (
        <p role="note" className="rounded-xl bg-status-menunggu px-4 py-3 text-sm text-status-menunggu-foreground">
          Tanggal ini bukan hari {namaHari(jadwal.hari)}.{admin ? "" : " Absensi hanya bisa diisi pada hari jadwal."}
        </p>
      )}
      {belumMulai && !admin && (
        <p role="note" className="rounded-xl bg-status-menunggu px-4 py-3 text-sm text-status-menunggu-foreground">
          Absen dibuka pukul {formatJam(jadwal.jam_mulai)} (waktu lembaga).
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Daftar hadir" className="xl:col-span-2">
          <FormAbsen
            key={tanggal}
            aksi={simpanAbsensi.bind(null, jadwal.id)}
            tanggal={tanggal}
            peserta={peserta}
            hadirAwal={[...hadir]}
            terkunci={Boolean(sesi?.dikunci) && !admin}
          />
        </Kartu>
        <Kartu judul="Sesi ini">
          {sesi ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hadir</dt>
                <dd>
                  {sesi.hadir} dari {sesi.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Honor sesi</dt>
                <dd className="font-judul text-lg">{formatRupiah(sesi.honor)}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                {sesi.dikunci && <Chip warna="netral">Terkunci</Chip>}
                {sesi.honor_dikoreksi && <Chip warna="kuning">Honor dikoreksi admin</Chip>}
              </div>
              <Link href={`/absensi/sesi/${sesi.id}`} className="mt-2 text-sm font-medium text-accent hover:underline">
                Lihat detail sesi
              </Link>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum diabsen. Honor dihitung otomatis saat disimpan: ada yang hadir = honor penuh, tidak ada yang hadir =
              setengah.
            </p>
          )}
        </Kartu>
      </div>
    </>
  );
}
