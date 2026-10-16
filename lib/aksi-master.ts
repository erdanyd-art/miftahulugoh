"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { penggunaStaf, wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { skemaJadwal, skemaKelas, skemaMeet, skemaPeserta } from "@/lib/validasi/master";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

// Terjemahkan galat database menjadi pesan yang bisa dipahami admin.
function pesanGalatDb(galat: { code?: string; message?: string }, namaGanda = "Data dengan nama ini sudah ada."): string {
  if (galat.code === "23505") return namaGanda;
  if (galat.message?.includes("berperan tutor")) return "Pengguna yang dipilih bukan tutor.";
  if (galat.code === "23514") return "Data tidak memenuhi aturan. Periksa jam dan tautan Meet.";
  if (galat.code === "23503") return "Data terkait tidak ditemukan atau masih dipakai.";
  return "Data gagal disimpan. Coba lagi.";
}

// ===== Peserta =====

export async function simpanPeserta(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Peserta tidak ditemukan." };
  const hasil = skemaPeserta.safeParse({
    nama: formData.get("nama"),
    catatan: formData.get("catatan") ?? "",
    aktif: formData.get("aktif"),
  });
  if (!hasil.success) return { galat: "Nama wajib diisi (maks. 100 karakter); catatan maks. 500 karakter." };

  const supabase = await buatKlienServer();
  if (id === null) {
    const { data, error } = await supabase.from("peserta").insert(hasil.data).select("id").single();
    if (error) return { galat: pesanGalatDb(error) };
    redirect(`/peserta/${data.id}?pesan=disimpan`);
  }

  const { data, error } = await supabase.from("peserta").update(hasil.data).eq("id", id).select("id");
  if (error || !data?.length) return { galat: error ? pesanGalatDb(error) : "Peserta tidak ditemukan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

// ===== Kelas =====

export async function simpanKelas(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Kelas tidak ditemukan." };
  const hasil = skemaKelas.safeParse({
    nama: formData.get("nama"),
    keterangan: formData.get("keterangan") ?? "",
    aktif: formData.get("aktif"),
  });
  if (!hasil.success) return { galat: "Nama kelas wajib diisi (maks. 100 karakter)." };

  const supabase = await buatKlienServer();
  const namaGanda = "Nama kelas sudah dipakai kelas lain.";
  if (id === null) {
    const { data, error } = await supabase.from("kelas").insert(hasil.data).select("id").single();
    if (error) return { galat: pesanGalatDb(error, namaGanda) };
    redirect(`/kelas/${data.id}?pesan=disimpan`);
  }

  const { data, error } = await supabase.from("kelas").update(hasil.data).eq("id", id).select("id");
  if (error || !data?.length) return { galat: error ? pesanGalatDb(error, namaGanda) : "Kelas tidak ditemukan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

export async function tambahAnggota(kelasId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  const pesertaId = formData.get("pesertaId");
  if (!idValid(kelasId) || !idValid(pesertaId)) return { galat: "Pilih peserta yang akan ditambahkan." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("kelas_peserta").insert({ kelas_id: kelasId, peserta_id: pesertaId });
  if (error) return { galat: pesanGalatDb(error, "Peserta ini sudah menjadi anggota kelas.") };
  refresh();
  return { pesan: "Peserta ditambahkan ke kelas." };
}

export async function keluarkanAnggota(kelasId: string, pesertaId: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(kelasId) || !idValid(pesertaId)) return { galat: "Permintaan tidak valid." };

  const supabase = await buatKlienServer();
  const { error } = await supabase
    .from("kelas_peserta")
    .delete()
    .eq("kelas_id", kelasId)
    .eq("peserta_id", pesertaId);
  if (error) return { galat: "Peserta gagal dikeluarkan." };
  refresh();
  return { pesan: "Peserta dikeluarkan dari kelas." };
}

// ===== Jadwal =====

export async function simpanJadwal(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Jadwal tidak ditemukan." };
  const hasil = skemaJadwal.safeParse({
    kelasId: formData.get("kelasId"),
    tutorId: formData.get("tutorId"),
    hari: formData.get("hari"),
    jamMulai: formData.get("jamMulai"),
    jamSelesai: formData.get("jamSelesai"),
    honor: formData.get("honor"),
    meetUrl: formData.get("meetUrl") ?? "",
    aktif: formData.get("aktif"),
  });
  if (!hasil.success) {
    const jam = hasil.error.issues.some((i) => i.path[0] === "jamSelesai");
    const meet = hasil.error.issues.some((i) => i.path[0] === "meetUrl");
    if (jam) return { galat: "Jam selesai harus setelah jam mulai." };
    if (meet) return { galat: "Tautan Meet harus diawali https:// (atau kosongkan)." };
    return { galat: "Lengkapi kelas, tutor, hari, jam, dan honor (angka bulat rupiah)." };
  }

  const d = hasil.data;
  const baris = {
    kelas_id: d.kelasId,
    tutor_id: d.tutorId,
    hari: d.hari,
    jam_mulai: d.jamMulai,
    jam_selesai: d.jamSelesai,
    honor: d.honor,
    meet_url: d.meetUrl,
    aktif: d.aktif,
  };

  const supabase = await buatKlienServer();
  if (id === null) {
    const { data, error } = await supabase.from("jadwal").insert(baris).select("id").single();
    if (error) return { galat: pesanGalatDb(error) };
    redirect(`/jadwal/${data.id}?pesan=disimpan`);
  }

  const { data, error } = await supabase.from("jadwal").update(baris).eq("id", id).select("id");
  if (error || !data?.length) return { galat: error ? pesanGalatDb(error) : "Jadwal tidak ditemukan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

// Tutor (jadwal miliknya) dan admin. Penulisan lewat fungsi database ubah_meet(), bukan UPDATE langsung.
export async function ubahMeet(jadwalId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await penggunaStaf();
  if (!idValid(jadwalId)) return { galat: "Jadwal tidak ditemukan." };
  const hasil = skemaMeet.safeParse(formData.get("meetUrl") ?? "");
  if (!hasil.success) return { galat: "Tautan Meet harus diawali https:// (atau kosongkan)." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("ubah_meet", { p_jadwal_id: jadwalId, p_url: hasil.data ?? "" });
  if (error) {
    if (error.message.includes("bukan jadwal Anda")) return { galat: "Ini bukan jadwal Anda." };
    return { galat: "Tautan Meet gagal disimpan." };
  }
  refresh();
  return { pesan: "Tautan Meet tersimpan." };
}
