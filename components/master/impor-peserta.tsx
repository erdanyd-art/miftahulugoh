"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PesanStatus } from "@/components/form";
import { Chip } from "@/components/tabel";
import { type HasilPeriksa, imporPeserta, periksaImpor } from "@/lib/aksi-impor";
import { BATAS_UKURAN } from "@/lib/impor-csv";

const LABEL = { siap: "Siap", lewati: "Dilewati", galat: "Bermasalah" } as const;
const WARNA = { siap: "hijau", lewati: "kuning", galat: "merah" } as const;

export function ImporPeserta() {
  const [teks, setTeks] = useState("");
  const [namaBerkas, setNamaBerkas] = useState("");
  const [hasil, setHasil] = useState<HasilPeriksa | undefined>();
  const [sedang, mulai] = useTransition();

  async function pilihBerkas(berkas: File | undefined) {
    setHasil(undefined);
    setTeks("");
    setNamaBerkas(berkas?.name ?? "");
    if (!berkas) return;
    if (berkas.size > BATAS_UKURAN) {
      setHasil({ galat: "Berkas terlalu besar (maksimal 500 KB)." });
      return;
    }
    const isi = await berkas.text();
    setTeks(isi);
    mulai(async () => setHasil(await periksaImpor(isi)));
  }

  const selesai = Boolean(hasil?.pesan);
  const bisaImpor = !selesai && hasil?.ringkas && hasil.ringkas.galat === 0 && hasil.ringkas.siap > 0;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm font-medium">
        Berkas CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => pilihBerkas(e.target.files?.[0])}
          className="rounded-xl border border-dashed border-input bg-card p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </label>
      {sedang && <p className="text-sm text-muted-foreground">Memeriksa {namaBerkas}...</p>}
      <PesanStatus galat={hasil?.galat} pesan={hasil?.pesan} />

      {hasil?.ringkas && hasil.baris && !selesai && (
        <>
          <div className="flex flex-wrap gap-2 text-sm" aria-live="polite">
            <Chip warna="hijau">{hasil.ringkas.siap} siap diimpor</Chip>
            <Chip warna="kuning">{hasil.ringkas.lewati} dilewati</Chip>
            <Chip warna="merah">{hasil.ringkas.galat} bermasalah</Chip>
          </div>
          {hasil.ringkas.galat > 0 && (
            <p className="text-sm text-status-belum-foreground">
              Perbaiki baris bermasalah di berkas, simpan, lalu pilih berkasnya lagi.
            </p>
          )}
          <div className="max-h-[28rem] overflow-auto rounded-2xl border" tabIndex={0} role="region" aria-label="Pratinjau impor">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Baris</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Nama</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Kelas</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hasil.baris.map((b) => (
                  <tr key={b.baris}>
                    <td className="px-3 py-2 text-muted-foreground">{b.baris}</td>
                    <td className="px-3 py-2">
                      {b.nama || "–"}
                      {b.catatan && <span className="block text-xs text-muted-foreground">{b.catatan}</span>}
                    </td>
                    <td className="px-3 py-2">{b.kelas.join(", ") || "–"}</td>
                    <td className="px-3 py-2">
                      <Chip warna={WARNA[b.status]}>{LABEL[b.status]}</Chip>
                      {b.alasan && <span className="mt-1 block text-xs text-muted-foreground">{b.alasan}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            disabled={!bisaImpor || sedang}
            onClick={() => mulai(async () => setHasil(await imporPeserta(teks)))}
            className="h-11 w-fit rounded-full px-6 text-base"
          >
            {sedang ? "Mengimpor..." : `Impor ${hasil.ringkas.siap} peserta`}
          </Button>
        </>
      )}

      {selesai && (
        <Link href="/peserta" className="w-fit text-sm font-medium text-accent hover:underline">
          Lihat daftar peserta
        </Link>
      )}
    </div>
  );
}
