import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PesanStatus } from "@/components/form";
import { Kartu, Memuat, PESAN_UMUM, TautanKembali } from "@/components/halaman";
import { FormJadwal } from "@/components/master/form-master";
import { Chip } from "@/components/tabel";
import { simpanJadwal } from "@/lib/aksi-master";
import { ambilJadwal, pilihanForm } from "@/lib/data/master";
import { formatJam, namaHari } from "@/lib/format";
import { param } from "@/lib/tabel";

export const metadata: Metadata = { title: "Ubah jadwal" };

export default function HalamanUbahJadwal({ params, searchParams }: PageProps<"/jadwal/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/jadwal" label="Kembali ke daftar jadwal" />
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
  params: Promise<{ id: string }>;
  searchParams: PageProps<"/jadwal/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [jadwal, pilihan] = await Promise.all([ambilJadwal(id), pilihanForm()]);
  if (!jadwal) notFound();
  const pesan = PESAN_UMUM[param(await searchParams, "pesan")];

  // Kelas/tutor yang kini nonaktif tetap ditampilkan agar pilihan saat ini tidak hilang dari form.
  const kelas = jadwal.kelas && !pilihan.kelas.some((k) => k.id === jadwal.kelas_id) ? [...pilihan.kelas, jadwal.kelas] : pilihan.kelas;
  const tutor = jadwal.tutor && !pilihan.tutor.some((t) => t.id === jadwal.tutor_id) ? [...pilihan.tutor, jadwal.tutor] : pilihan.tutor;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">
          {jadwal.kelas?.nama} · {namaHari(jadwal.hari)} {formatJam(jadwal.jam_mulai)}
        </h1>
        <Chip warna={jadwal.aktif ? "hijau" : "merah"}>{jadwal.aktif ? "Aktif" : "Nonaktif"}</Chip>
      </div>
      {pesan && <PesanStatus pesan={pesan} />}
      <Kartu judul="Data jadwal">
        <FormJadwal
          aksi={simpanJadwal.bind(null, jadwal.id)}
          kelas={kelas}
          tutor={tutor}
          awal={{
            kelasId: jadwal.kelas_id,
            tutorId: jadwal.tutor_id,
            hari: jadwal.hari,
            jamMulai: jadwal.jam_mulai,
            jamSelesai: jadwal.jam_selesai,
            honor: jadwal.honor,
            meetUrl: jadwal.meet_url,
            aktif: jadwal.aktif,
          }}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          Mengubah honor hanya berlaku untuk sesi berikutnya; honor sesi yang sudah tercatat tidak berubah.
        </p>
      </Kartu>
    </>
  );
}
