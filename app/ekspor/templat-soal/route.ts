import { wajibPeran } from "@/lib/auth";
import { keCsv, responsCsv } from "@/lib/csv";

// Templat impor soal (contoh fiktif). jenis: pg / isian. kunci: huruf A-F. audio: judul audio yang sudah diunggah.
export async function GET() {
  await wajibPeran("admin");
  const isi = keCsv(
    ["nomor", "jenis", "pertanyaan", "a", "b", "c", "d", "e", "f", "kunci", "acuan", "bobot", "audio"],
    [
      ["1", "pg", "ما معنى كلمة كتاب؟ (hapus baris contoh ini)", "Buku", "Pena", "Meja", "Pintu", "", "", "A", "", "2", ""],
      ["2", "isian", "Terjemahkan: ذهب أحمد إلى المدرسة", "", "", "", "", "", "", "", "Ahmad pergi ke sekolah", "3", ""],
    ],
  );
  return responsCsv("templat-impor-soal.csv", isi);
}
