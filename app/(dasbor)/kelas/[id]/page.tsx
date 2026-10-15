import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PesanStatus } from "@/components/form";
import { Kartu, Memuat, PESAN_UMUM, TautanKembali } from "@/components/halaman";
import { FormKelas, FormTambahAnggota, TombolKeluarkan } from "@/components/master/form-master";
import { Chip } from "@/components/tabel";
import { simpanKelas, tambahAnggota } from "@/lib/aksi-master";
import { ambilKelas, pilihanForm } from "@/lib/data/master";
import { param } from "@/lib/tabel";

export const metadata: Metadata = { title: "Ubah kelas" };

export default function HalamanUbahKelas({ params, searchParams }: PageProps<"/kelas/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/kelas" label="Kembali ke daftar kelas" />
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
  searchParams: PageProps<"/kelas/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const [kelas, pilihan] = await Promise.all([ambilKelas(id), pilihanForm()]);
  if (!kelas) notFound();
  const pesan = PESAN_UMUM[param(await searchParams, "pesan")];
  const sudahAnggota = new Set(kelas.anggota.map((a) => a.id));

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{kelas.nama}</h1>
        <Chip warna={kelas.aktif ? "hijau" : "merah"}>{kelas.aktif ? "Aktif" : "Nonaktif"}</Chip>
      </div>
      {pesan && <PesanStatus pesan={pesan} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Kartu judul="Data kelas">
          <FormKelas
            aksi={simpanKelas.bind(null, kelas.id)}
            awal={{ nama: kelas.nama, keterangan: kelas.keterangan, aktif: kelas.aktif }}
          />
        </Kartu>
        <Kartu judul={`Anggota kelas (${kelas.anggota.length})`}>
          <FormTambahAnggota
            aksi={tambahAnggota.bind(null, kelas.id)}
            pilihan={pilihan.peserta.filter((p) => !sudahAnggota.has(p.id))}
          />
          {kelas.anggota.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada anggota.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {kelas.anggota.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <Link href={`/peserta/${p.id}`} className="hover:underline">
                      {p.nama}
                    </Link>
                    {!p.aktif && <Chip warna="merah">Nonaktif</Chip>}
                  </span>
                  <TombolKeluarkan kelasId={kelas.id} peserta={{ id: p.id, nama: p.nama }} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Peserta nonaktif tidak dihitung dalam absensi.
          </p>
        </Kartu>
      </div>
    </>
  );
}
