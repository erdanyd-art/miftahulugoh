"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { klienAdmin } from "@/lib/supabase/admin";
import { buatKlienServer } from "@/lib/supabase/server";
import { emailPeserta, skemaUsername } from "@/lib/validasi/auth";

// sandiAwal hanya dikembalikan sekali ke layar admin; tidak disimpan atau dicatat di mana pun.
export type StatusAkun = { galat?: string; pesan?: string; username?: string; sandiAwal?: string } | undefined;

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

// Kata sandi awal acak (tanpa huruf yang mirip: l/1, o/0), mudah didiktekan: "abcde-fghij".
const HURUF = "abcdefghjkmnpqrstuvwxyz23456789";
function sandiAcak() {
  const bagian = () => Array.from({ length: 5 }, () => HURUF[randomInt(HURUF.length)]).join("");
  return `${bagian()}-${bagian()}`;
}

export async function buatAkunPeserta(pesertaId: string, _: StatusAkun, formData: FormData): Promise<StatusAkun> {
  await wajibPeran("admin");
  if (!idValid(pesertaId)) return { galat: "Peserta tidak ditemukan." };
  const hasil = skemaUsername.safeParse(formData.get("username"));
  if (!hasil.success) {
    return { galat: "Username 3–30 karakter: huruf kecil, angka, titik, atau garis bawah (awali huruf/angka)." };
  }
  const username = hasil.data;
  const sandiAwal = sandiAcak();

  const admin = klienAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: emailPeserta(username),
    password: sandiAwal,
    email_confirm: true, // tidak ada email yang dikirim untuk akun peserta
  });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { galat: "Username ini sudah dipakai. Pilih yang lain." };
    console.error("akun peserta gagal dibuat", error?.code, error?.message);
    return { galat: "Akun gagal dibuat. Coba lagi." };
  }

  // Profil + tautan ke peserta ditulis dengan sesi admin (RLS + audit), atomik di database.
  const supabase = await buatKlienServer();
  const { error: galatTaut } = await supabase.rpc("hubungkan_akun_peserta", {
    p_peserta_id: pesertaId,
    p_user_id: data.user.id,
  });
  if (galatTaut) {
    await admin.auth.admin.deleteUser(data.user.id);
    if (galatTaut.message.includes("sudah punya akun")) return { galat: "Peserta ini sudah punya akun." };
    return { galat: "Akun gagal dihubungkan ke peserta. Coba lagi." };
  }

  // Tanpa refresh(): halaman baru dimuat setelah admin menekan "Selesai", agar sandi awal tidak hilang dari layar.
  return { pesan: "Akun dibuat.", username, sandiAwal };
}

export async function aturUlangSandiPeserta(pesertaId: string): Promise<StatusAkun> {
  await wajibPeran("admin");
  if (!idValid(pesertaId)) return { galat: "Peserta tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data: peserta } = await supabase.from("peserta").select("user_id").eq("id", pesertaId).maybeSingle();
  if (!peserta?.user_id) return { galat: "Peserta ini belum punya akun." };

  // Tandai wajib ganti dulu: bila langkah berikutnya gagal, sandi lama tetap berlaku dan aman diulang.
  const { error: galatTanda } = await supabase
    .from("profiles")
    .update({ wajib_ganti_sandi: true })
    .eq("id", peserta.user_id);
  if (galatTanda) return { galat: "Kata sandi gagal diatur ulang. Coba lagi." };

  const sandiAwal = sandiAcak();
  const { data, error } = await klienAdmin().auth.admin.updateUserById(peserta.user_id, { password: sandiAwal });
  if (error) {
    console.error("atur ulang sandi peserta gagal", error.code, error.message);
    return { galat: "Kata sandi gagal diatur ulang. Coba lagi." };
  }
  refresh();
  return { pesan: "Kata sandi diatur ulang.", username: data.user.email?.split("@")[0], sandiAwal };
}
