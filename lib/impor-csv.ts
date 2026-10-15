// Membaca CSV dari Excel/Google Sheets: pemisah koma, titik koma, atau tab (dideteksi dari baris kepala),
// sel bertanda kutip, BOM UTF-8, dan akhir baris CRLF/LF.
export const BATAS_BARIS = 1000;
export const BATAS_UKURAN = 500 * 1024; // byte

function pemisah(barisKepala: string): string {
  const hitung = (c: string) => barisKepala.split(c).length - 1;
  return [";", "\t", ","].reduce((terbaik, c) => (hitung(c) > hitung(terbaik) ? c : terbaik), ",");
}

export function bacaCsv(teks: string): string[][] {
  const isi = teks.replace(/^﻿/, "");
  const sep = pemisah(isi.split(/\r?\n/, 1)[0] ?? "");
  const baris: string[][] = [];
  let sel = "";
  let barisIni: string[] = [];
  let dalamKutip = false;

  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (dalamKutip) {
      if (c === '"' && isi[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') dalamKutip = false;
      else sel += c;
    } else if (c === '"' && sel === "") dalamKutip = true;
    else if (c === sep) {
      barisIni.push(sel);
      sel = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && isi[i + 1] === "\n") i++;
      barisIni.push(sel);
      baris.push(barisIni);
      barisIni = [];
      sel = "";
    } else sel += c;
  }
  if (sel !== "" || barisIni.length > 0) {
    barisIni.push(sel);
    baris.push(barisIni);
  }
  return baris.filter((b) => b.some((s) => s.trim() !== ""));
}

const ALIAS: Record<"nama" | "catatan" | "kelas", string[]> = {
  nama: ["nama", "nama peserta", "nama siswa", "nama murid", "nama lengkap"],
  catatan: ["catatan", "keterangan", "ket"],
  kelas: ["kelas", "nama kelas"],
};

export type BarisPeserta = { baris: number; nama: string; catatan: string; kelas: string[] };

// Mengubah CSV menjadi daftar peserta. Galat struktur (mis. tanpa kolom nama) dikembalikan sebagai pesan.
export function uraiPeserta(teks: string): { data: BarisPeserta[]; galat?: string } {
  const baris = bacaCsv(teks);
  if (baris.length === 0) return { data: [], galat: "Berkas kosong." };
  const kepala = baris[0].map((k) => k.trim().toLowerCase());
  const indeks = (k: keyof typeof ALIAS) => kepala.findIndex((h) => ALIAS[k].includes(h));
  const iNama = indeks("nama");
  if (iNama < 0) return { data: [], galat: 'Baris pertama harus berisi judul kolom, minimal "nama".' };
  const iCatatan = indeks("catatan");
  const iKelas = indeks("kelas");
  if (baris.length - 1 > BATAS_BARIS) return { data: [], galat: `Maksimal ${BATAS_BARIS} peserta per impor.` };

  return {
    data: baris.slice(1).map((b, i) => ({
      baris: i + 2,
      nama: (b[iNama] ?? "").trim().replace(/\s+/g, " "),
      catatan: iCatatan >= 0 ? (b[iCatatan] ?? "").trim() : "",
      kelas:
        iKelas >= 0
          ? (b[iKelas] ?? "")
              .split(/[;|]/)
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
    })),
  };
}
