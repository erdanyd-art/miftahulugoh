"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PesanStatus } from "@/components/form";
import { Chip } from "@/components/tabel";
import { Button } from "@/components/ui/button";
import { type HasilPeriksaSoal, imporSoal, periksaImporSoal } from "@/lib/aksi-impor-soal";
import { BATAS_UKURAN } from "@/lib/impor-csv";
import { HURUF_OPSI } from "@/lib/validasi/ujian";

export function ImporSoal({ ujianId }: { ujianId: string }) {
  const [teks, setTeks] = useState("");
  const [namaBerkas, setNamaBerkas] = useState("");
  const [hasil, setHasil] = useState<HasilPeriksaSoal | undefined>();
  const [sedang, mulai] = useTransition();

  async function pilihBerkas(berkas: File | undefined) {
    setHasil(undefined);
    setTeks("");
    setNamaBerkas(berkas?.name ?? "");
    if (!berkas) return;
    if (berkas.size > BATAS_UKURAN) return setHasil({ galat: "Berkas terlalu besar (maksimal 500 KB)." });
    const isi = await berkas.text();
    setTeks(isi);
    mulai(async () => setHasil(await periksaImporSoal(ujianId, isi)));
  }

  const selesai = Boolean(hasil?.pesan);
  const bisaImpor = !selesai && hasil?.baris && hasil.bermasalah === 0 && (hasil.siap ?? 0) > 0;

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

      {hasil?.baris && !selesai && (
        <>
          <div className="flex flex-wrap gap-2 text-sm" aria-live="polite">
            <Chip warna="hijau">{hasil.siap} siap diimpor</Chip>
            <Chip warna="merah">{hasil.bermasalah} bermasalah</Chip>
          </div>
          {(hasil.bermasalah ?? 0) > 0 && (
            <p className="text-sm text-status-belum-foreground">
              Perbaiki baris bermasalah di berkas, simpan, lalu pilih berkasnya lagi. Tidak ada soal yang disimpan sebelum
              semua baris benar.
            </p>
          )}
          <div className="max-h-[32rem] overflow-auto rounded-2xl border" tabIndex={0} role="region" aria-label="Pratinjau impor soal">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Baris</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">No.</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Soal</th>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hasil.baris.map((b) => (
                  <tr key={b.baris} className="align-top">
                    <td className="px-3 py-2 text-muted-foreground">{b.baris}</td>
                    <td className="px-3 py-2">{b.nomor}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {b.jenis === "isian" ? "Isian" : "Pilihan ganda"} · bobot {b.bobot}
                        {b.audio && ` · audio: ${b.audio}`}
                      </span>
                      <span className="block whitespace-pre-wrap" dir="auto">
                        {b.pertanyaan || "–"}
                      </span>
                      {b.jenis === "pilihan_ganda" && b.opsi.length > 0 && (
                        <span className="mt-1 block text-xs">
                          {b.opsi.map((o, i) => (
                            <span key={i} className={i === b.kunci ? "font-semibold text-status-lunas-foreground" : ""}>
                              {HURUF_OPSI[i]}. <span dir="auto">{o}</span>
                              {i === b.kunci && " ✓"}
                              {i < b.opsi.length - 1 && " · "}
                            </span>
                          ))}
                        </span>
                      )}
                      {b.jenis === "isian" && b.acuan && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Acuan: <span dir="auto">{b.acuan}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Chip warna={b.galat ? "merah" : "hijau"}>{b.galat ? "Bermasalah" : "Siap"}</Chip>
                      {b.galat && <span className="mt-1 block text-xs text-muted-foreground">{b.galat}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            disabled={!bisaImpor || sedang}
            onClick={() => mulai(async () => setHasil(await imporSoal(ujianId, teks)))}
            className="h-11 w-fit rounded-full px-6 text-base"
          >
            {sedang ? "Mengimpor..." : `Impor ${hasil.siap} soal`}
          </Button>
        </>
      )}

      {selesai && (
        <Link href={`/ujian/${ujianId}#soal`} className="w-fit text-sm font-medium text-accent hover:underline">
          Lihat soal ujian
        </Link>
      )}
    </div>
  );
}
