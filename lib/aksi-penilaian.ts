"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { penggunaStaf, wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

// Admin atau tutor pengampu (diperiksa fungsi database nilai_isian). Kosong = batalkan penilaian.
export async function nilaiIsian(jawabanId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await penggunaStaf();
  if (!idValid(jawabanId)) return { galat: "Jawaban tidak ditemukan." };
  const mentah = String(formData.get("skor") ?? "").trim();
  const hasil = z.union([z.literal("").transform(() => null), z.coerce.number().int().min(0).max(100)]).safeParse(mentah);
  if (!hasil.success) return { galat: "Skor harus bilangan bulat." };
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("nilai_isian", { p_jawaban_id: jawabanId, p_skor: hasil.data as number });
  if (error) {
    if (error.message.includes("0 sampai bobot")) return { galat: "Skor harus 0 sampai bobot soal." };
    if (error.message.includes("belum selesai")) return { galat: "Peserta belum selesai mengerjakan." };
    return { galat: "Skor gagal disimpan." };
  }
  refresh();
  return { pesan: hasil.data === null ? "Penilaian dibatalkan." : "Tersimpan." };
}

export async function umumkanNilai(ujianId: string, umumkan: boolean): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(ujianId) || typeof umumkan !== "boolean") return { galat: "Permintaan tidak valid." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("ujian")
    .update({ diumumkan_pada: umumkan ? new Date().toISOString() : null })
    .eq("id", ujianId)
    .select("id");
  if (error) {
    if (error.message.includes("belum ditutup")) return { galat: "Nilai baru bisa diumumkan setelah ujian ditutup." };
    return { galat: "Status pengumuman gagal diubah." };
  }
  if (!data?.length) return { galat: "Ujian tidak ditemukan." };
  refresh();
  return { pesan: umumkan ? "Nilai diumumkan: peserta kini bisa melihat nilainya." : "Pengumuman dibatalkan." };
}
