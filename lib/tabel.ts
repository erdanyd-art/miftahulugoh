// Utilitas tabel: membaca parameter URL (cari, filter, urut, halaman) dan memotong per halaman.
export type ParamUrl = Record<string, string | string[] | undefined>;

export const PER_HALAMAN = 20;

export function param(sp: ParamUrl, nama: string): string {
  const nilai = sp[nama];
  return typeof nilai === "string" ? nilai : "";
}

export function potongHalaman<T>(baris: T[], nomorDiminta: string) {
  const total = Math.max(1, Math.ceil(baris.length / PER_HALAMAN));
  const angka = Number.parseInt(nomorDiminta, 10);
  const nomor = Number.isFinite(angka) ? Math.min(Math.max(angka, 1), total) : 1;
  return { baris: baris.slice((nomor - 1) * PER_HALAMAN, nomor * PER_HALAMAN), nomor, total, jumlah: baris.length };
}

// URL halaman yang sama dengan sebagian parameter diganti (nilai kosong = hapus).
export function urlDengan(dasar: string, sp: ParamUrl, ubah: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) q.set(k, v);
  for (const [k, v] of Object.entries(ubah)) {
    if (v) q.set(k, v);
    else q.delete(k);
  }
  const s = q.toString();
  return s ? `${dasar}?${s}` : dasar;
}

export function cocokCari(cari: string, ...kolom: string[]): boolean {
  const c = cari.trim().toLowerCase();
  return !c || kolom.some((k) => k.toLowerCase().includes(c));
}
