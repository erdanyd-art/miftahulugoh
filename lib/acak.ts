import { createHash } from "node:crypto";

// Urutan acak yang TETAP untuk satu benih (mis. id percobaan + id soal): sama setiap kali halaman dimuat,
// berbeda antar peserta. Server-only (node:crypto); hasilnya hanya urutan tampilan.
export function urutAcak<T>(benih: string, daftar: T[]): T[] {
  return daftar
    .map((isi, i) => ({ isi, kunci: createHash("sha256").update(`${benih}:${i}`).digest("hex") }))
    .sort((a, b) => a.kunci.localeCompare(b.kunci))
    .map((x) => x.isi);
}
