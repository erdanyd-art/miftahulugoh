"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { penggunaWajib, wajibPeran } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { pesanGalatAbsensi } from "@/lib/pesan-galat";
import { buatKlienServer } from "@/lib/supabase/server";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const skemaSimpan = z.object({
  jadwalId: z.guid(),
  tanggal: z.iso.date(),
  hadir: z.array(z.guid()).max(500),
});

// Honor dan jendela waktu TIDAK dihitung di sini: semuanya oleh fungsi database simpan_absensi().
export async function simpanAbsensi(jadwalId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await penggunaWajib();
  const hasil = skemaSimpan.safeParse({
    jadwalId,
    tanggal: formData.get("tanggal"),
    hadir: formData.getAll("hadir"),
  });
  if (!hasil.success) return { galat: "Data absensi tidak valid. Muat ulang halaman." };

  const supabase = await buatKlienServer();
  const { data: sesiId, error } = await supabase.rpc("simpan_absensi", {
    p_jadwal_id: hasil.data.jadwalId,
    p_tanggal: hasil.data.tanggal,
    p_hadir_ids: hasil.data.hadir,
  });
  if (error) return { galat: pesanGalatAbsensi(error.message) };

  const { data: sesi } = await supabase.from("sesi").select("hadir, total, honor").eq("id", sesiId).single();
  refresh();
  return sesi
    ? { pesan: `Absensi tersimpan: hadir ${sesi.hadir} dari ${sesi.total}. Honor sesi ${formatRupiah(sesi.honor)}.` }
    : { pesan: "Absensi tersimpan." };
}

export async function koreksiHonor(sesiId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  const hasil = z
    .object({ sesiId: z.guid(), honor: z.coerce.number().int().min(0).max(100_000_000) })
    .safeParse({ sesiId, honor: formData.get("honor") });
  if (!hasil.success) return { galat: "Honor harus angka bulat rupiah, tidak negatif." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("koreksi_honor", { p_sesi_id: hasil.data.sesiId, p_honor: hasil.data.honor });
  if (error) return { galat: pesanGalatAbsensi(error.message) };
  refresh();
  return { pesan: `Honor dikoreksi menjadi ${formatRupiah(hasil.data.honor)} (tercatat di log audit).` };
}

export async function kunciSesi(sesiId: string, kunci: boolean): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!z.guid().safeParse(sesiId).success || typeof kunci !== "boolean") return { galat: "Permintaan tidak valid." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("kunci_sesi", { p_sesi_id: sesiId, p_kunci: kunci });
  if (error) return { galat: pesanGalatAbsensi(error.message) };
  refresh();
  return { pesan: kunci ? "Sesi dikunci. Tutor tidak bisa mengubahnya lagi." : "Kunci sesi dibuka." };
}
