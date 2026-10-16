import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FormKoreksiHonor, TombolKunci } from "@/components/absensi/form-absensi";
import { Kartu, Memuat, TautanKembali } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { koreksiHonor } from "@/lib/aksi-absensi";
import { penggunaStaf } from "@/lib/auth";
import { ambilSesi, waktuLembaga } from "@/lib/data/absensi";
import { formatJam, formatRupiah } from "@/lib/format";
import { formatTanggal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Detail sesi" };

export default function HalamanSesi({ params }: PageProps<"/absensi/sesi/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/absensi" label="Kembali ke absensi" />
      <Suspense fallback={<Memuat />}>
        <Isi params={params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const pengguna = await penggunaStaf();
  const admin = pengguna.peran === "admin";
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [sesi, waktu] = await Promise.all([ambilSesi(id), waktuLembaga()]);
  if (!sesi) notFound();
  const bolehUbah = admin || (!sesi.dikunci && sesi.tanggal === waktu.tanggal);

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl">{sesi.kelas?.nama}</h1>
          {sesi.dikunci && <Chip warna="netral">Terkunci</Chip>}
          {sesi.honor_dikoreksi && <Chip warna="kuning">Honor dikoreksi</Chip>}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatTanggal(sesi.tanggal)}
          {sesi.jadwal ? ` · ${formatJam(sesi.jadwal.jam_mulai)}–${formatJam(sesi.jadwal.jam_selesai)}` : ""} ·{" "}
          {sesi.tutor?.nama}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul={`Kehadiran: ${sesi.hadir} dari ${sesi.total}`} className="xl:col-span-2">
          {sesi.murid.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada peserta aktif saat sesi disimpan.</p>
          ) : (
            <ul className="divide-y">
              {sesi.murid.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  {m.nama}
                  <Chip warna={m.hadir ? "hijau" : "merah"}>{m.hadir ? "Hadir" : "Tidak hadir"}</Chip>
                </li>
              ))}
            </ul>
          )}
          {bolehUbah && (
            <Link
              href={`/absensi/isi/${sesi.jadwal_id}?tanggal=${sesi.tanggal}`}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Ubah absensi sesi ini
            </Link>
          )}
        </Kartu>

        <div className="flex flex-col gap-6">
          <Kartu judul="Honor">
            <p className="font-judul text-3xl">{formatRupiah(sesi.honor)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Honor jadwal saat itu {formatRupiah(sesi.honor_standar)}.{" "}
              {sesi.honor_dikoreksi ? "Dikoreksi admin; tidak berubah bila absensi disimpan ulang." : "Dihitung otomatis."}
            </p>
            {admin && (
              <div className="mt-4">
                <FormKoreksiHonor aksi={koreksiHonor.bind(null, sesi.id)} honor={sesi.honor} />
              </div>
            )}
          </Kartu>
          {admin && (
            <Kartu judul="Kunci sesi">
              <p className="mb-4 text-sm text-muted-foreground">Sesi terkunci tidak bisa diubah tutor.</p>
              <TombolKunci sesiId={sesi.id} dikunci={sesi.dikunci} />
            </Kartu>
          )}
        </div>
      </div>
    </>
  );
}
