import "server-only";
import { wajibPeran } from "@/lib/auth";
import { urutAcak } from "@/lib/acak";
import { BUCKET_AUDIO } from "@/lib/data/ujian";
import { buatKlienServer } from "@/lib/supabase/server";

export type StatusUjianSaya = "terjadwal" | "dibuka" | "dikerjakan" | "selesai" | "terlewat";

type BarisUjianSaya = {
  id: string;
  judul: string;
  keterangan: string | null;
  kelas: string;
  mulai: string;
  selesai: string;
  durasi_menit: number;
  jumlah_soal: number;
  percobaan_id: string | null;
  batas_selesai: string | null;
  selesai_pada: string | null;
  sekarang: string;
  acak_soal: boolean;
  acak_opsi: boolean;
};

// Status dihitung dari jam DATABASE (kolom "sekarang"), bukan jam perangkat. Penegakan tetap di fungsi database.
function statusDari(u: BarisUjianSaya): StatusUjianSaya {
  const kini = Date.parse(u.sekarang);
  if (u.percobaan_id) {
    return u.selesai_pada || kini >= Date.parse(u.batas_selesai ?? u.sekarang) ? "selesai" : "dikerjakan";
  }
  if (kini < Date.parse(u.mulai)) return "terjadwal";
  if (kini >= Date.parse(u.selesai)) return "terlewat";
  return "dibuka";
}

export async function daftarUjianSaya() {
  await wajibPeran("peserta");
  const supabase = await buatKlienServer();
  const [{ data, error }, { data: atur }, { data: nilai }] = await Promise.all([
    supabase.rpc("ujian_saya"),
    supabase.from("pengaturan").select("zona_waktu").single(),
    supabase.rpc("nilai_saya"), // hanya ujian yang sudah diumumkan admin
  ]);
  if (error) throw new Error("Gagal memuat ujian");
  const nilaiPer = new Map((nilai ?? []).map((n) => [n.ujian_id, n]));
  return {
    zona: atur?.zona_waktu ?? "Asia/Makassar",
    ujian: (data as BarisUjianSaya[]).map((u) => ({ ...u, status: statusDari(u), nilai: nilaiPer.get(u.id) ?? null })),
  };
}

export type UjianSaya = Awaited<ReturnType<typeof daftarUjianSaya>>["ujian"][number];

// Satu ujian untuk peserta. Soal, audio, dan jawaban hanya dimuat (dan hanya terbaca, lewat RLS) saat dikerjakan.
export async function ambilUjianSaya(ujianId: string) {
  const { zona, ujian } = await daftarUjianSaya();
  const u = ujian.find((x) => x.id === ujianId);
  if (!u) return null;
  if (u.status !== "dikerjakan" || !u.percobaan_id || !u.batas_selesai) return { zona, ujian: u, pengerjaan: null };

  const supabase = await buatKlienServer();
  const [soal, audio, jawaban] = await Promise.all([
    supabase
      .from("soal")
      .select("id, urutan, jenis, pertanyaan, opsi, audio_id, dibuat_pada")
      .eq("ujian_id", ujianId)
      .order("urutan")
      .order("dibuat_pada"),
    supabase.from("audio_ujian").select("id, judul, path").eq("ujian_id", ujianId),
    supabase.from("jawaban").select("soal_id, pilihan, isian").eq("percobaan_id", u.percobaan_id),
  ]);
  if (soal.error || audio.error || jawaban.error) throw new Error("Gagal memuat soal");

  const sisaMs = Math.max(0, Date.parse(u.batas_selesai) - Date.parse(u.sekarang));
  const paths = (audio.data ?? []).map((a) => a.path);
  const { data: tautan } = paths.length
    ? await supabase.storage.from(BUCKET_AUDIO).createSignedUrls(paths, Math.ceil(sisaMs / 1000) + 120)
    : { data: [] };
  const urlPer = new Map((tautan ?? []).map((t) => [t.path, t.signedUrl]));
  const audioPer = new Map((audio.data ?? []).map((a) => [a.id, { judul: a.judul, url: urlPer.get(a.path) ?? null }]));

  return {
    zona,
    ujian: u,
    pengerjaan: {
      percobaanId: u.percobaan_id,
      sisaMs,
      // Acak (bila diaktifkan) tetap per percobaan. Pilihan membawa indeks ASLI-nya: itulah yang disimpan sebagai jawaban.
      soal: (u.acak_soal ? urutAcak(u.percobaan_id, soal.data ?? []) : (soal.data ?? [])).map((s, posisi) => {
        const opsi = (s.opsi ?? []).map((teks, asli) => ({ asli, teks }));
        return {
          id: s.id,
          nomor: posisi + 1,
          jenis: s.jenis,
          pertanyaan: s.pertanyaan,
          opsi: u.acak_opsi ? urutAcak(`${u.percobaan_id}:${s.id}`, opsi) : opsi,
          audio: s.audio_id ? (audioPer.get(s.audio_id) ?? null) : null,
        };
      }),
      jawaban: Object.fromEntries(
        (jawaban.data ?? []).map((j) => [j.soal_id, j.pilihan ?? j.isian ?? null] as const),
      ) as Record<string, number | string | null>,
    },
  };
}

export type Pengerjaan = NonNullable<NonNullable<Awaited<ReturnType<typeof ambilUjianSaya>>>["pengerjaan"]>;
