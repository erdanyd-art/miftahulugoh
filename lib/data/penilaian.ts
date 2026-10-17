import "server-only";
import { penggunaStaf } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

async function zona(supabase: Awaited<ReturnType<typeof buatKlienServer>>) {
  const { data } = await supabase.from("pengaturan").select("zona_waktu").single();
  return data?.zona_waktu ?? "Asia/Makassar";
}

// Ujian yang boleh diperiksa: admin semua, tutor kelas yang diampu (ditegakkan fungsi database).
export async function ujianDiperiksa() {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const [{ data, error }, z] = await Promise.all([supabase.rpc("ujian_diperiksa"), zona(supabase)]);
  if (error) throw new Error("Gagal memuat ujian");
  return { zona: z, ujian: data };
}

export async function ambilHasil(ujianId: string) {
  const { zona: z, ujian } = await ujianDiperiksa();
  const info = ujian.find((u) => u.id === ujianId);
  if (!info) return null;
  const supabase = await buatKlienServer();
  const [hasil, isian] = await Promise.all([
    supabase.rpc("hasil_ujian", { p_ujian_id: ujianId }),
    supabase.rpc("isian_ujian", { p_ujian_id: ujianId }),
  ]);
  if (hasil.error || isian.error) throw new Error("Gagal memuat hasil");

  // Kelompokkan jawaban isian per soal agar pemeriksa menilai satu soal untuk semua peserta.
  const perSoal = new Map<
    string,
    { soalId: string; nomor: number; pertanyaan: string; acuan: string | null; bobot: number; jawaban: typeof isian.data }
  >();
  for (const j of isian.data) {
    const g = perSoal.get(j.soal_id) ?? {
      soalId: j.soal_id,
      nomor: j.nomor,
      pertanyaan: j.pertanyaan,
      acuan: j.acuan,
      bobot: j.bobot,
      jawaban: [],
    };
    g.jawaban.push(j);
    perSoal.set(j.soal_id, g);
  }

  const ditutup = Date.parse(info.sekarang) >= Date.parse(info.selesai);
  return { zona: z, info, ditutup, hasil: hasil.data, isian: [...perSoal.values()] };
}

export type DataHasil = NonNullable<Awaited<ReturnType<typeof ambilHasil>>>;

// Semua jawaban satu peserta (admin / tutor pengampu; diperiksa fungsi database).
export async function ambilJawabanPercobaan(percobaanId: string) {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const [{ data, error }, z] = await Promise.all([
    supabase.rpc("jawaban_percobaan", { p_percobaan_id: percobaanId }),
    zona(supabase),
  ]);
  if (error || !data?.length) return null;
  return { zona: z, soal: data, info: data[0] };
}
