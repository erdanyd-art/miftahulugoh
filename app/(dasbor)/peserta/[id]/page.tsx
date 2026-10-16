import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { PesanStatus } from "@/components/form";
import { Kartu, Memuat, PESAN_UMUM, TautanKembali } from "@/components/halaman";
import { AkunPeserta, FormBuatAkunPeserta } from "@/components/master/akun-peserta";
import { FormPeserta } from "@/components/master/form-master";
import { Chip } from "@/components/tabel";
import { simpanPeserta } from "@/lib/aksi-master";
import { ambilAkunPeserta, ambilPeserta } from "@/lib/data/master";
import { param } from "@/lib/tabel";

export const metadata: Metadata = { title: "Ubah peserta" };

export default function HalamanUbahPeserta({ params, searchParams }: PageProps<"/peserta/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/peserta" label="Kembali ke daftar peserta" />
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
  searchParams: PageProps<"/peserta/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const peserta = await ambilPeserta(id);
  if (!peserta) notFound();
  const pesan = PESAN_UMUM[param(await searchParams, "pesan")];
  const akun = peserta.user_id ? await ambilAkunPeserta(peserta.user_id) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{peserta.nama}</h1>
        <Chip warna={peserta.aktif ? "hijau" : "merah"}>{peserta.aktif ? "Aktif" : "Nonaktif"}</Chip>
      </div>
      {pesan && <PesanStatus pesan={pesan} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Kartu judul="Data peserta" className="xl:col-span-2">
          <FormPeserta
            aksi={simpanPeserta.bind(null, peserta.id)}
            awal={{ nama: peserta.nama, catatan: peserta.catatan, aktif: peserta.aktif }}
          />
        </Kartu>
        <Kartu judul="Kelas yang diikuti">
          {peserta.kelas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum terdaftar di kelas mana pun.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {peserta.kelas.map((k) => (
                <li key={k.id}>
                  <Link href={`/kelas/${k.id}`} className="text-sm font-medium text-accent hover:underline">
                    {k.nama}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Anggota kelas diatur dari halaman kelas.</p>
        </Kartu>
        <Kartu judul="Akun ujian" className="xl:col-span-3">
          {akun ? <AkunPeserta pesertaId={peserta.id} akun={akun} /> : <FormBuatAkunPeserta pesertaId={peserta.id} />}
        </Kartu>
      </div>
    </>
  );
}
