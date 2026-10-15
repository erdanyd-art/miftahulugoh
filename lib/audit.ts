// Mengubah baris audit_log (jsonb sebelum/sesudah) menjadi daftar perubahan yang mudah dibaca.
export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];
export type Perubahan = { kolom: string; sebelum: string; sesudah: string };

export const NAMA_TABEL: Record<string, string> = {
  profiles: "Pengguna",
  jadwal: "Jadwal",
  sesi: "Sesi absensi",
  kas: "Kas",
  pembayaran: "Pembayaran",
  pengaturan: "Pengaturan",
};

export const NAMA_AKSI: Record<string, string> = { INSERT: "Tambah", UPDATE: "Ubah", DELETE: "Hapus" };

// Kolom teknis yang tidak perlu ditampilkan.
const ABAIKAN = new Set(["id", "dibuat_pada", "diubah_pada", "dibuat_oleh"]);

function teks(nilai: Json | undefined): string {
  if (nilai === null || nilai === undefined) return "–";
  if (typeof nilai === "boolean") return nilai ? "ya" : "tidak";
  if (typeof nilai === "object") return JSON.stringify(nilai);
  return String(nilai);
}

function sebagaiObjek(nilai: Json | null): Record<string, Json | undefined> {
  return nilai && typeof nilai === "object" && !Array.isArray(nilai) ? nilai : {};
}

export function daftarPerubahan(aksi: string, sebelum: Json | null, sesudah: Json | null): Perubahan[] {
  const lama = sebagaiObjek(sebelum);
  const baru = sebagaiObjek(sesudah);
  const kolom = [...new Set([...Object.keys(lama), ...Object.keys(baru)])].filter((k) => !ABAIKAN.has(k));
  return kolom
    .filter((k) => aksi !== "UPDATE" || JSON.stringify(lama[k]) !== JSON.stringify(baru[k]))
    .map((k) => ({
      kolom: k,
      sebelum: aksi === "INSERT" ? "" : teks(lama[k]),
      sesudah: aksi === "DELETE" ? "" : teks(baru[k]),
    }));
}
