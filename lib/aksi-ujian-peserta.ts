"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

const PESAN: [string, string][] = [
  ["belum dibuka", "Ujian belum dibuka."],
  ["sudah ditutup", "Ujian sudah ditutup."],
  ["waktu ujian sudah habis", "Waktu ujian sudah habis. Jawaban tidak bisa diubah lagi."],
  ["belum punya soal", "Ujian ini belum punya soal. Hubungi admin."],
  ["tidak ditemukan", "Ujian tidak ditemukan."],
];
const pesanDari = (m?: string) => PESAN.find(([k]) => m?.includes(k))?.[1] ?? "Terjadi kesalahan. Coba lagi.";

export async function mulaiUjian(ujianId: string): Promise<StatusAksi> {
  await wajibPeran("peserta");
  if (!idValid(ujianId)) return { galat: "Ujian tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("mulai_ujian", { p_ujian_id: ujianId });
  if (error) return { galat: pesanDari(error.message) };
  refresh();
  return { pesan: "Ujian dimulai." };
}

// Dipanggil otomatis setiap jawaban berubah. Waktu dan kepemilikan diperiksa fungsi database.
export async function simpanJawaban(
  percobaanId: string,
  soalId: string,
  jawaban: number | string | null,
): Promise<{ galat?: string; habis?: boolean }> {
  await wajibPeran("peserta");
  if (!idValid(percobaanId) || !idValid(soalId)) return { galat: "Soal tidak ditemukan." };
  const pilihan = typeof jawaban === "number" && Number.isInteger(jawaban) ? jawaban : null;
  const isian = typeof jawaban === "string" ? jawaban.slice(0, 5000) : null;
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_jawaban", {
    p_percobaan_id: percobaanId,
    p_soal_id: soalId,
    p_pilihan: pilihan as number, // null = kosongkan
    p_isian: isian as string,
  });
  if (error) return { galat: pesanDari(error.message), habis: error.message.includes("waktu ujian sudah habis") };
  return {};
}

export async function selesaikanUjian(percobaanId: string): Promise<StatusAksi> {
  await wajibPeran("peserta");
  if (!idValid(percobaanId)) return { galat: "Ujian tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("selesai_ujian", { p_percobaan_id: percobaanId });
  if (error) return { galat: pesanDari(error.message) };
  refresh();
  return { pesan: "Ujian selesai." };
}
