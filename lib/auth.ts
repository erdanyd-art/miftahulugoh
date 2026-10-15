import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Peran } from "@/lib/nav";
import { buatKlienServer } from "@/lib/supabase/server";

export type Pengguna = { id: string; nama: string; peran: Peran };

// Lapisan akses data untuk identitas. Peran SELALU dibaca dari tabel profiles (lewat RLS),
// bukan dari cookie, metadata, atau data kiriman klien. Di-cache per permintaan.
export const penggunaSaatIni = cache(async (): Promise<Pengguna | "belum-masuk" | "tidak-aktif"> => {
  const supabase = await buatKlienServer();
  // getUser() memverifikasi token ke server Auth (bukan sekadar membaca cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "belum-masuk";

  // RLS hanya mengembalikan profil sendiri yang aktif; akun nonaktif/tanpa profil -> null.
  const { data: profil } = await supabase
    .from("profiles")
    .select("id, nama, peran")
    .eq("id", user.id)
    .eq("aktif", true)
    .maybeSingle();
  if (!profil) return "tidak-aktif";

  return profil;
});

export async function penggunaWajib(): Promise<Pengguna> {
  const hasil = await penggunaSaatIni();
  if (hasil === "belum-masuk") redirect("/masuk");
  if (hasil === "tidak-aktif") redirect("/akun-tidak-aktif");
  return hasil;
}

// Pemeriksaan peran di server. Ini membatasi halaman; data tetap dilindungi RLS di database.
export async function wajibPeran(peran: Peran): Promise<Pengguna> {
  const pengguna = await penggunaWajib();
  if (pengguna.peran !== peran) redirect("/tidak-berwenang");
  return pengguna;
}
