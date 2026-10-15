// CSV untuk diunduh admin dan dibuka di Excel/Google Sheets.
// Keamanan: sel TEKS yang diawali = + - @ (atau tab/CR) diberi tanda petik di depan agar tidak
// dijalankan sebagai formula (CSV/formula injection). Angka ditulis apa adanya.
export type Sel = string | number | null | undefined;

const AWALAN_BERBAHAYA = /^[=+\-@\t\r]/;

export function selCsv(nilai: Sel): string {
  if (nilai === null || nilai === undefined) return "";
  if (typeof nilai === "number") return Number.isFinite(nilai) ? String(nilai) : "";
  let teks = nilai;
  if (AWALAN_BERBAHAYA.test(teks)) teks = `'${teks}`;
  return /[",\n\r]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
}

export function keCsv(kepala: string[], baris: Sel[][]): string {
  const isi = [kepala, ...baris].map((b) => b.map(selCsv).join(",")).join("\r\n");
  return `﻿${isi}\r\n`; // BOM agar Excel membaca UTF-8 (huruf Arab/beraksen)
}

export function responsCsv(namaBerkas: string, isi: string): Response {
  return new Response(isi, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
