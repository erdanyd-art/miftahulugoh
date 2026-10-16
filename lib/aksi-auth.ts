"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { penggunaWajib } from "@/lib/auth";
import { buatKlienServer, envSupabase } from "@/lib/supabase/server";
import {
  DOMAIN_PESERTA,
  PANJANG_SANDI_MIN,
  skemaAturSandi,
  skemaGantiSandi,
  skemaLupaSandi,
  skemaMasuk,
} from "@/lib/validasi/auth";

// email dikembalikan agar isian tidak kosong lagi setelah form dikirim (React mereset form).
export type StatusForm = { galat?: string; pesan?: string; email?: string } | undefined;

export async function masuk(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const hasil = skemaMasuk.safeParse({ email: formData.get("email"), kataSandi: formData.get("kataSandi") });
  const email = String(formData.get("email") ?? "");
  if (!hasil.success) return { galat: "Isi email/username dan kata sandi dengan benar.", email };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: hasil.data.email,
    password: hasil.data.kataSandi,
  });
  // Pesan sama untuk email tak terdaftar dan kata sandi salah (tidak membocorkan email terdaftar).
  if (error || !data.user) return { galat: "Email/username atau kata sandi salah.", email };

  const { data: profil } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .eq("aktif", true)
    .maybeSingle();
  if (!profil) {
    await supabase.auth.signOut();
    return { galat: "Akun ini tidak aktif. Hubungi admin lembaga.", email };
  }

  redirect("/");
}

export async function keluar() {
  const supabase = await buatKlienServer();
  // Hanya perangkat ini; sesi di perangkat lain tidak ikut keluar.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/masuk");
}

export async function lupaSandi(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const hasil = skemaLupaSandi.safeParse({ email: formData.get("email") });
  if (!hasil.success) return { galat: "Masukkan alamat email yang benar." };

  // Alamat tujuan divalidasi Supabase terhadap daftar URL pengalihan yang diizinkan.
  const asal = (await headers()).get("origin") ?? "http://localhost:3000";
  // Akun peserta tidak punya email sungguhan: tidak dikirimi apa pun (sandi direset admin).
  if (hasil.data.email.endsWith(`@${DOMAIN_PESERTA}`)) {
    return { pesan: "Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim." };
  }
  const supabase = await buatKlienServer();
  await supabase.auth.resetPasswordForEmail(hasil.data.email, {
    redirectTo: `${asal}/auth/callback?next=/atur-sandi`,
  });

  // Selalu pesan yang sama, terdaftar atau tidak.
  return { pesan: "Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim." };
}

export async function aturSandi(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const hasil = skemaAturSandi.safeParse({ kataSandi: formData.get("kataSandi"), ulangi: formData.get("ulangi") });
  if (!hasil.success) {
    return { galat: `Kata sandi minimal ${PANJANG_SANDI_MIN} karakter dan kedua isian harus sama.` };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.updateUser({ password: hasil.data.kataSandi });
  if (error) {
    if (error.code === "same_password") return { galat: "Kata sandi baru harus berbeda dari yang lama." };
    if (error.code === "weak_password") return { galat: "Kata sandi terlalu lemah. Pakai yang lebih panjang." };
    return { galat: "Kata sandi gagal disimpan. Buka lagi tautan dari email atau coba lagi." };
  }

  redirect("/");
}

// Ganti kata sandi sendiri saat sudah masuk (tanpa email). Kata sandi lama diperiksa dulu
// lewat klien tanpa sesi, agar sesi yang tertinggal terbuka tidak cukup untuk mengganti sandi.
export async function gantiSandi(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const pengguna = await penggunaWajib();
  const hasil = skemaGantiSandi.safeParse({
    sandiLama: formData.get("sandiLama"),
    kataSandi: formData.get("kataSandi"),
    ulangi: formData.get("ulangi"),
  });
  if (!hasil.success) {
    return { galat: `Isi kata sandi lama. Kata sandi baru minimal ${PANJANG_SANDI_MIN} karakter dan kedua isian harus sama.` };
  }

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { galat: "Sesi berakhir. Silakan masuk lagi." };

  const { url, anonKey } = envSupabase();
  const cek = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: galatCek } = await cek.auth.signInWithPassword({ email: user.email, password: hasil.data.sandiLama });
  if (galatCek) return { galat: "Kata sandi lama salah." };
  await cek.auth.signOut({ scope: "local" });

  const { error } = await supabase.auth.updateUser({ password: hasil.data.kataSandi });
  if (error) {
    if (error.code === "same_password") return { galat: "Kata sandi baru harus berbeda dari yang lama." };
    if (error.code === "weak_password") return { galat: "Kata sandi terlalu lemah. Pakai yang lebih panjang." };
    return { galat: "Kata sandi gagal disimpan. Coba lagi." };
  }
  // Kata sandi awal dari admin sudah diganti: buka akses ke dashboard.
  if (pengguna.wajibGantiSandi) {
    await supabase.rpc("selesai_ganti_sandi");
    redirect("/");
  }
  return { pesan: "Kata sandi berhasil diganti. Pakai kata sandi baru saat masuk berikutnya." };
}
