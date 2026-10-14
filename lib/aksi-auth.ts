"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { PANJANG_SANDI_MIN, skemaAturSandi, skemaLupaSandi, skemaMasuk } from "@/lib/validasi/auth";

// email dikembalikan agar isian tidak kosong lagi setelah form dikirim (React mereset form).
export type StatusForm = { galat?: string; pesan?: string; email?: string } | undefined;

export async function masuk(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const hasil = skemaMasuk.safeParse({ email: formData.get("email"), kataSandi: formData.get("kataSandi") });
  const email = String(formData.get("email") ?? "");
  if (!hasil.success) return { galat: "Isi email dan kata sandi dengan benar.", email };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: hasil.data.email,
    password: hasil.data.kataSandi,
  });
  // Pesan sama untuk email tak terdaftar dan kata sandi salah (tidak membocorkan email terdaftar).
  if (error || !data.user) return { galat: "Email atau kata sandi salah.", email };

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
  await supabase.auth.signOut();
  redirect("/masuk");
}

export async function lupaSandi(_: StatusForm, formData: FormData): Promise<StatusForm> {
  const hasil = skemaLupaSandi.safeParse({ email: formData.get("email") });
  if (!hasil.success) return { galat: "Masukkan alamat email yang benar." };

  // Alamat tujuan divalidasi Supabase terhadap daftar URL pengalihan yang diizinkan.
  const asal = (await headers()).get("origin") ?? "http://localhost:3000";
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
