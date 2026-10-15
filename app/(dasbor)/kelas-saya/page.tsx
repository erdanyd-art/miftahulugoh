import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { wajibPeran } from "@/lib/auth";
import { kelasSaya } from "@/lib/data/master";

export const metadata: Metadata = { title: "Kelas Saya" };

export default function HalamanKelasSaya() {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Kelas Saya" />
      <Suspense fallback={<Memuat />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  await wajibPeran("tutor");
  const kelas = await kelasSaya();
  if (kelas.length === 0) {
    return (
      <Kartu>
        <p className="text-sm text-muted-foreground">Anda belum mengampu kelas mana pun.</p>
      </Kartu>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {kelas.map((k) => {
        const aktif = k.anggota.filter((a) => a.aktif);
        return (
          <li key={k.id}>
            <Kartu className="flex h-full flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg">{k.nama}</h2>
                <Chip warna="netral">{aktif.length} peserta aktif</Chip>
              </div>
              {k.keterangan && <p className="text-sm text-muted-foreground">{k.keterangan}</p>}
              {aktif.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada peserta aktif.</p>
              ) : (
                <ol className="list-decimal pl-5 text-sm">
                  {aktif.map((p) => (
                    <li key={p.id} className="py-0.5">
                      {p.nama}
                    </li>
                  ))}
                </ol>
              )}
            </Kartu>
          </li>
        );
      })}
    </ul>
  );
}
