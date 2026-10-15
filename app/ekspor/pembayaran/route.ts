import type { NextRequest } from "next/server";
import { keCsv, responsCsv } from "@/lib/csv";
import { waktuLembaga } from "@/lib/data/absensi";
import { daftarPembayaran } from "@/lib/data/keuangan";
import { bulanValid, rentangBulan } from "@/lib/waktu";

// Ekspor pembayaran peserta satu bulan. daftarPembayaran() memeriksa peran admin dan menyaring baris yang dihapus.
export async function GET(request: NextRequest) {
  const diminta = request.nextUrl.searchParams.get("bulan") ?? "";
  const bulan = bulanValid(diminta) ? diminta : (await waktuLembaga()).bulan;
  const { dari, sampai } = rentangBulan(bulan);
  const bayar = await daftarPembayaran(dari, sampai);
  const isi = keCsv(
    ["Tanggal", "Peserta", "Keterangan", "Jumlah (Rp)", "Status"],
    bayar.map((p) => [p.tanggal, p.peserta?.nama, p.keterangan, p.jumlah, p.status === "lunas" ? "Lunas" : "Belum Lunas"]),
  );
  return responsCsv(`pembayaran-${bulan}.csv`, isi);
}
