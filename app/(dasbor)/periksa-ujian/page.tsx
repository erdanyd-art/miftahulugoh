import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Kartu, Memuat } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { wajibPeran } from "@/lib/auth";
import { ujianDiperiksa } from "@/lib/data/penilaian";
import { formatWaktu } from "@/lib/waktu";

export const metadata: Metadata = { title: "Periksa ujian" };

export default function HalamanDaftarPeriksa() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Periksa Ujian</h1>
      <Suspense fallback={<Memuat />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  await wajibPeran("tutor");
  const { zona, ujian } = await ujianDiperiksa();
  return (
    <Kartu>
      {ujian.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada ujian terbit untuk kelas yang Anda ampu.</p>
      ) : (
        <ul className="divide-y">
          {ujian.map((u) => (
            <li key={u.id}>
              <Link href={`/periksa-ujian/${u.id}`} className="flex flex-col gap-1 py-3 hover:bg-secondary/50">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium" dir="auto">
                    {u.judul}
                  </span>
                  {u.isian_belum > 0 ? (
                    <Chip warna="kuning">{u.isian_belum} isian belum dinilai</Chip>
                  ) : (
                    <Chip warna="netral">{u.peserta_mulai} peserta mengerjakan</Chip>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {u.kelas} · {formatWaktu(u.mulai, zona)} – {formatWaktu(u.selesai, zona)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kartu>
  );
}
