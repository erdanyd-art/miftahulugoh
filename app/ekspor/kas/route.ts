import type { NextRequest } from "next/server";
import { keCsv, responsCsv } from "@/lib/csv";
import { waktuLembaga } from "@/lib/data/absensi";
import { daftarKas } from "@/lib/data/keuangan";
import { bulanValid, rentangBulan } from "@/lib/waktu";

// Ekspor kas satu bulan. daftarKas() memeriksa peran admin dan menyaring baris yang dihapus.
export async function GET(request: NextRequest) {
  const diminta = request.nextUrl.searchParams.get("bulan") ?? "";
  const bulan = bulanValid(diminta) ? diminta : (await waktuLembaga()).bulan;
  const { dari, sampai } = rentangBulan(bulan);
  const kas = await daftarKas(dari, sampai);
  const isi = keCsv(
    ["Tanggal", "Jenis", "Kategori", "Tutor", "Keterangan", "Jumlah (Rp)"],
    kas.map((k) => [k.tanggal, k.jenis, k.kategori?.nama, k.tutor?.nama, k.keterangan, k.jumlah]),
  );
  return responsCsv(`kas-${bulan}.csv`, isi);
}
