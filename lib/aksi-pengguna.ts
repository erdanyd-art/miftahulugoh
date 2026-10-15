"use server";

import { createClient } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { wajibPeran } from "@/lib/auth";
import { klienAdmin } from "@/lib/supabase/admin";
import { buatKlienServer, envSupabase } from "@/lib/supabase/server";
import { skemaPengaturan, skemaPenggunaBaru, skemaUbahPengguna } from "@/lib/validasi/pengguna";
import { z } from "zod";

// ID datang dari klien: selalu divalidasi sebelum dipakai.
const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

// Lama blokir login untuk akun nonaktif (Auth). Akses data sudah putus lewat profiles.aktif + RLS.
const BLOKIR_SELAMANYA = "876000h";

export async function tambahPengguna(_: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  const hasil = skemaPenggunaBaru.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    peran: formData.get("peran"),
  });
  if (!hasil.success) return { galat: "Isi nama, email yang benar, dan peran." };
  const { nama, email, peran } = hasil.data;

  const asal = (await headers()).get("origin") ?? "http://localhost:3000";
  const admin = klienAdmin();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${asal}/atur-sandi` });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { galat: "Email ini sudah terdaftar." };
    return { galat: "Undangan gagal dikirim. Coba lagi." };
  }

  // Profil ditulis dengan sesi admin (RLS + audit mencatat admin sebagai pelaku).
  const supabase = await buatKlienServer();
  const { error: galatProfil } = await supabase.from("profiles").insert({ id: data.user.id, nama, peran });
  if (galatProfil) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { galat: "Profil gagal disimpan. Coba lagi." };
  }

  redirect("/pengguna?pesan=ditambah");
}

export async function ubahPengguna(id: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  const saya = await wajibPeran("admin");
  if (!idValid(id)) return { galat: "Pengguna tidak ditemukan." };
  const hasil = skemaUbahPengguna.safeParse({ nama: formData.get("nama"), peran: formData.get("peran") });
  if (!hasil.success) return { galat: "Isi nama dan peran dengan benar." };
  const { nama, peran } = hasil.data;

  if (id === saya.id && peran !== "admin") return { galat: "Anda tidak bisa mengubah peran akun Anda sendiri." };

  const supabase = await buatKlienServer();
  if (peran === "admin") {
    const { count } = await supabase.from("jadwal").select("id", { count: "exact", head: true }).eq("tutor_id", id);
    if (count) return { galat: "Pengguna ini masih tercatat sebagai tutor di jadwal. Pindahkan jadwalnya dulu." };
  }

  const { data, error } = await supabase.from("profiles").update({ nama, peran }).eq("id", id).select("id");
  if (error || !data?.length) return { galat: "Perubahan gagal disimpan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

export async function ubahStatusAktif(id: string, aktif: boolean): Promise<StatusAksi> {
  const saya = await wajibPeran("admin");
  if (!idValid(id) || typeof aktif !== "boolean") return { galat: "Permintaan tidak valid." };
  if (id === saya.id) return { galat: "Anda tidak bisa menonaktifkan akun Anda sendiri." };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("profiles").update({ aktif }).eq("id", id).select("id");
  if (error || !data?.length) return { galat: "Status gagal diubah." };

  const { error: galatBlokir } = await klienAdmin().auth.admin.updateUserById(id, {
    ban_duration: aktif ? "none" : BLOKIR_SELAMANYA,
  });
  if (galatBlokir) {
    refresh();
    return { galat: "Status profil diubah, tetapi blokir login gagal diperbarui. Coba ulangi." };
  }
  refresh();
  return { pesan: aktif ? "Akun diaktifkan." : "Akun dinonaktifkan. Akses pengguna langsung terputus." };
}

export async function kirimTautanSandi(id: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id)) return { galat: "Pengguna tidak ditemukan." };
  const { data, error } = await klienAdmin().auth.admin.getUserById(id);
  if (error || !data.user.email) return { galat: "Pengguna tidak ditemukan." };

  // Klien anon tanpa sesi: tidak menyentuh cookie admin. Email memakai tautan token_hash.
  const { url, anonKey } = envSupabase();
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: galatKirim } = await anon.auth.resetPasswordForEmail(data.user.email);
  if (galatKirim) return { galat: "Tautan gagal dikirim. Tunggu sebentar lalu coba lagi." };
  return { pesan: `Tautan untuk membuat kata sandi dikirim ke ${data.user.email}.` };
}

export async function simpanPengaturan(_: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  const hasil = skemaPengaturan.safeParse({
    namaLembaga: formData.get("namaLembaga"),
    zonaWaktu: formData.get("zonaWaktu"),
  });
  if (!hasil.success) return { galat: "Nama lembaga wajib diisi dan zona waktu harus valid (contoh: Asia/Makassar)." };

  const supabase = await buatKlienServer();
  const { error } = await supabase
    .from("pengaturan")
    .update({ nama_lembaga: hasil.data.namaLembaga, zona_waktu: hasil.data.zonaWaktu })
    .eq("id", true);
  if (error) return { galat: "Pengaturan gagal disimpan. Periksa zona waktu." };
  refresh();
  return { pesan: "Pengaturan tersimpan." };
}
