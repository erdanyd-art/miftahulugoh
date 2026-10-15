import { wajibPeran } from "@/lib/auth";
import { keCsv, responsCsv } from "@/lib/csv";

// Templat impor peserta (contoh fiktif). Banyak kelas dipisah tanda |
export async function GET() {
  await wajibPeran("admin");
  const isi = keCsv(
    ["nama", "catatan", "kelas"],
    [
      ["Contoh Nama Siswa", "hapus baris contoh ini", "Bahasa Arab Dasar"],
      ["Contoh Siswa Dua", "", "Bahasa Arab Dasar|Nahwu Shorof"],
    ],
  );
  return responsCsv("templat-impor-peserta.csv", isi);
}
