import "server-only";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

export const BUCKET_AUDIO = "audio-ujian";

async function zonaLembaga() {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengaturan").select("zona_waktu").single();
  return data?.zona_waktu ?? "Asia/Makassar";
}

export async function daftarUjian() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const [{ data, error }, zona] = await Promise.all([
    supabase
      .from("ujian")
      .select("id, judul, mulai, selesai, durasi_menit, terbit, kelas(id, nama), soal(count)")
      .order("mulai", { ascending: false }),
    zonaLembaga(),
  ]);
  if (error) throw new Error("Gagal memuat ujian");
  return { zona, ujian: data.map((u) => ({ ...u, jumlahSoal: u.soal[0]?.count ?? 0 })) };
}

// Detail ujian untuk admin: soal + kunci + audio (dengan tautan putar sementara, 1 jam).
export async function ambilUjian(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const [{ data: ujian }, zona] = await Promise.all([
    supabase
      .from("ujian")
      .select(
        "id, judul, keterangan, kelas_id, mulai, selesai, durasi_menit, terbit, kelas(nama), soal(id, urutan, jenis, pertanyaan, opsi, audio_id, bobot, dibuat_pada, soal_kunci(jawaban_benar, kunci_isian)), audio_ujian(id, judul, path, ukuran, dibuat_pada)",
      )
      .eq("id", id)
      .maybeSingle(),
    zonaLembaga(),
  ]);
  if (!ujian) return null;

  const audio = [...ujian.audio_ujian].sort((a, b) => a.dibuat_pada.localeCompare(b.dibuat_pada));
  const { data: tautan } = audio.length
    ? await supabase.storage.from(BUCKET_AUDIO).createSignedUrls(audio.map((a) => a.path), 3600)
    : { data: [] };
  const urlPer = new Map((tautan ?? []).map((t) => [t.path, t.signedUrl]));
  const soal = [...ujian.soal]
    .sort((a, b) => a.urutan - b.urutan || a.dibuat_pada.localeCompare(b.dibuat_pada))
    .map((s) => ({ ...s, kunci: s.soal_kunci }));

  return {
    ...ujian,
    zona,
    soal,
    audio: audio.map((a) => ({
      ...a,
      url: urlPer.get(a.path) ?? null,
      dipakai: soal.filter((s) => s.audio_id === a.id).length,
    })),
  };
}

export type DetailUjian = NonNullable<Awaited<ReturnType<typeof ambilUjian>>>;

export async function zonaUntukForm() {
  await wajibPeran("admin");
  return zonaLembaga();
}
