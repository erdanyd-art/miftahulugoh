// Mengurai CSV soal ujian (templat: /ekspor/templat-soal). Murni (tanpa database), diuji di impor-soal.test.ts.
import { bacaCsv } from "./impor-csv";

export const BATAS_SOAL = 300;
const HURUF = ["a", "b", "c", "d", "e", "f"] as const;

const ALIAS: Record<string, string[]> = {
  nomor: ["nomor", "no", "no.", "urutan"],
  jenis: ["jenis", "tipe", "jenis soal"],
  pertanyaan: ["pertanyaan", "soal", "teks soal"],
  kunci: ["kunci", "kunci jawaban", "jawaban"],
  acuan: ["acuan", "acuan jawaban", "kunci isian"],
  bobot: ["bobot", "nilai", "skor"],
  audio: ["audio", "judul audio"],
  ...Object.fromEntries(HURUF.map((h) => [h, [h, `pilihan ${h}`, `opsi ${h}`]])),
};

export type SoalCsv = {
  baris: number;
  nomor: number | null;
  jenis: "pilihan_ganda" | "isian";
  pertanyaan: string;
  opsi: string[];
  kunci: number | null; // indeks opsi
  acuan: string;
  bobot: number;
  audio: string; // judul audio (dicocokkan di server)
  galat?: string;
};

function jenisDari(teks: string, adaOpsi: boolean): "pilihan_ganda" | "isian" | null {
  const t = teks.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (!t) return adaOpsi ? "pilihan_ganda" : "isian";
  if (["pg", "pilihan ganda", "pilgan", "multiple choice"].includes(t)) return "pilihan_ganda";
  if (["isian", "esai", "essay", "uraian"].includes(t)) return "isian";
  return null;
}

export function uraiSoal(teks: string): { data: SoalCsv[]; galat?: string } {
  const baris = bacaCsv(teks);
  if (baris.length === 0) return { data: [], galat: "Berkas kosong." };
  const kepala = baris[0].map((k) => k.trim().toLowerCase());
  const kolom = (k: string) => kepala.findIndex((h) => ALIAS[k].includes(h));
  const i = Object.fromEntries(Object.keys(ALIAS).map((k) => [k, kolom(k)])) as Record<string, number>;
  if (i.pertanyaan < 0) return { data: [], galat: 'Baris pertama harus berisi judul kolom, minimal "pertanyaan".' };
  if (baris.length - 1 > BATAS_SOAL) return { data: [], galat: `Maksimal ${BATAS_SOAL} soal per impor.` };
  const sel = (b: string[], k: string) => (i[k] >= 0 ? (b[i[k]] ?? "").trim() : "");

  return {
    data: baris.slice(1).map((b, n) => {
      const opsiMentah = HURUF.map((h) => sel(b, h));
      while (opsiMentah.length && !opsiMentah[opsiMentah.length - 1]) opsiMentah.pop();
      const jenis = jenisDari(sel(b, "jenis"), opsiMentah.length > 0);
      const nomorTeks = sel(b, "nomor");
      const bobotTeks = sel(b, "bobot");
      const kunciTeks = sel(b, "kunci").toLowerCase();
      const hasil: SoalCsv = {
        baris: n + 2,
        nomor: nomorTeks ? Number(nomorTeks) : null,
        jenis: jenis ?? "isian",
        pertanyaan: sel(b, "pertanyaan"),
        opsi: opsiMentah,
        kunci: kunciTeks ? HURUF.indexOf(kunciTeks as (typeof HURUF)[number]) : null,
        acuan: sel(b, "acuan"),
        bobot: bobotTeks ? Number(bobotTeks) : 1,
        audio: sel(b, "audio"),
      };

      if (!hasil.pertanyaan) hasil.galat = "Pertanyaan kosong";
      else if (hasil.pertanyaan.length > 5000) hasil.galat = "Pertanyaan lebih dari 5000 karakter";
      else if (!jenis) hasil.galat = 'Jenis harus "pg" atau "isian"';
      else if (hasil.nomor !== null && !(Number.isInteger(hasil.nomor) && hasil.nomor >= 1 && hasil.nomor <= 500))
        hasil.galat = "Nomor harus bilangan bulat 1–500";
      else if (!(Number.isInteger(hasil.bobot) && hasil.bobot >= 1 && hasil.bobot <= 100)) hasil.galat = "Bobot harus 1–100";
      else if (jenis === "pilihan_ganda") {
        if (hasil.opsi.length < 2) hasil.galat = "Pilihan ganda butuh minimal 2 pilihan (kolom a, b, ...)";
        else if (hasil.opsi.some((o) => !o)) hasil.galat = "Ada pilihan kosong di tengah";
        else if (hasil.opsi.some((o) => o.length > 1000)) hasil.galat = "Pilihan lebih dari 1000 karakter";
        else if (hasil.kunci === null || hasil.kunci < 0 || hasil.kunci >= hasil.opsi.length)
          hasil.galat = `Kunci harus salah satu huruf A–${HURUF[hasil.opsi.length - 1].toUpperCase()}`;
      } else {
        if (hasil.opsi.length) hasil.galat = "Soal isian tidak memakai kolom pilihan a–f";
        else if (kunciTeks) hasil.galat = "Soal isian memakai kolom acuan, bukan kunci";
        else if (hasil.acuan.length > 2000) hasil.galat = "Acuan lebih dari 2000 karakter";
      }
      return hasil;
    }),
  };
}
