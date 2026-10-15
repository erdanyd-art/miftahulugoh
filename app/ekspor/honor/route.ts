import type { NextRequest } from "next/server";
import { keCsv, responsCsv } from "@/lib/csv";
import { waktuLembaga } from "@/lib/data/absensi";
import { rekapHonorTahun } from "@/lib/data/keuangan";

// Ekspor rekap honor tutor per bulan dalam satu tahun. rekapHonorTahun() memeriksa peran admin.
export async function GET(request: NextRequest) {
  const tahunIni = Number((await waktuLembaga()).bulan.slice(0, 4));
  const diminta = Number(request.nextUrl.searchParams.get("tahun"));
  const tahun = Number.isInteger(diminta) && diminta >= 2020 && diminta <= tahunIni ? diminta : tahunIni;
  const baris = await rekapHonorTahun(tahun);
  const isi = keCsv(
    ["Bulan", "Tutor", "Jumlah sesi", "Honor sesi (Rp)", "Honor dibayar (Rp)"],
    baris.map((b) => [b.bulan, b.tutor, b.jumlahSesi, b.honorSesi, b.honorDibayar]),
  );
  return responsCsv(`rekap-honor-${tahun}.csv`, isi);
}
