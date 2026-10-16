import "server-only";
import { wajibPeran } from "@/lib/auth";
import type { Peran } from "@/lib/nav";
import { klienAdmin } from "@/lib/supabase/admin";
import { buatKlienServer } from "@/lib/supabase/server";

export type BarisPengguna = {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  aktif: boolean;
  dibuatPada: string;
};

// Profil dibaca lewat RLS (sesi admin); email hanya ada di Auth, jadi dibaca dengan klien admin.
export async function daftarPengguna(): Promise<BarisPengguna[]> {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  // Akun peserta dikelola dari halaman Peserta, bukan Pengguna.
  const { data: profil, error } = await supabase
    .from("profiles")
    .select("id, nama, peran, aktif, dibuat_pada")
    .neq("peran", "peserta");
  if (error) throw new Error("Gagal memuat pengguna");

  // Skala lembaga kecil: satu halaman Auth (maks. 1000 akun) cukup.
  const { data: akun } = await klienAdmin().auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailPer = new Map(akun.users.map((u) => [u.id, u.email ?? ""]));

  return profil.map((p) => ({
    id: p.id,
    nama: p.nama,
    email: emailPer.get(p.id) ?? "",
    peran: p.peran,
    aktif: p.aktif,
    dibuatPada: p.dibuat_pada,
  }));
}

export async function ambilPengguna(id: string): Promise<BarisPengguna | null> {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data: p } = await supabase
    .from("profiles")
    .select("id, nama, peran, aktif, dibuat_pada")
    .eq("id", id)
    .neq("peran", "peserta")
    .maybeSingle();
  if (!p) return null;

  const { data } = await klienAdmin().auth.admin.getUserById(id);
  return { id: p.id, nama: p.nama, email: data.user?.email ?? "", peran: p.peran, aktif: p.aktif, dibuatPada: p.dibuat_pada };
}

export async function ambilPengaturan() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("pengaturan").select("nama_lembaga, zona_waktu").single();
  if (error) throw new Error("Gagal memuat pengaturan");
  return data;
}
