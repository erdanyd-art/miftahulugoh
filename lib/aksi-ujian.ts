"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { BUCKET_AUDIO } from "@/lib/data/ujian";
import { buatKlienServer } from "@/lib/supabase/server";
import { JENIS_AUDIO, skemaSoal, skemaUjian, skemaUnggahAudio } from "@/lib/validasi/ujian";
import { lokalKeIso } from "@/lib/waktu";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const GALAT_TERKUNCI = "Soal tidak bisa diubah: sudah ada peserta yang mulai mengerjakan ujian ini. Kunci jawaban dan bobot tetap bisa dikoreksi.";

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

async function zona(supabase: Awaited<ReturnType<typeof buatKlienServer>>) {
  const { data } = await supabase.from("pengaturan").select("zona_waktu").single();
  return data?.zona_waktu ?? "Asia/Makassar";
}

// ===== Ujian =====

export async function simpanUjian(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Ujian tidak ditemukan." };
  const hasil = skemaUjian.safeParse({
    judul: formData.get("judul"),
    keterangan: formData.get("keterangan") ?? "",
    kelasId: formData.get("kelasId"),
    mulai: formData.get("mulai"),
    selesai: formData.get("selesai"),
    durasiMenit: formData.get("durasiMenit"),
    acakSoal: formData.get("acakSoal") === "on",
    acakOpsi: formData.get("acakOpsi") === "on",
  });
  if (!hasil.success) {
    return { galat: "Periksa isian: judul, kelas, waktu mulai/selesai (selesai setelah mulai), durasi 1–600 menit." };
  }
  const d = hasil.data;
  const supabase = await buatKlienServer();
  const z_ = await zona(supabase);
  const baris = {
    judul: d.judul,
    keterangan: d.keterangan,
    kelas_id: d.kelasId,
    mulai: lokalKeIso(d.mulai, z_),
    selesai: lokalKeIso(d.selesai, z_),
    durasi_menit: d.durasiMenit,
    acak_soal: d.acakSoal,
    acak_opsi: d.acakOpsi,
  };

  if (id === null) {
    const { data, error } = await supabase.from("ujian").insert(baris).select("id").single();
    if (error) return { galat: "Ujian gagal disimpan." };
    redirect(`/ujian/${data.id}?pesan=disimpan`);
  }
  const { data, error } = await supabase.from("ujian").update(baris).eq("id", id).select("id");
  if (error || !data?.length) return { galat: "Ujian gagal disimpan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

export async function aturTerbit(id: string, terbit: boolean): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id) || typeof terbit !== "boolean") return { galat: "Permintaan tidak valid." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("ujian").update({ terbit }).eq("id", id).select("id");
  if (error) {
    if (error.message.includes("belum punya soal")) return { galat: "Tambahkan minimal satu soal sebelum menerbitkan." };
    return { galat: "Status gagal diubah." };
  }
  if (!data?.length) return { galat: "Ujian tidak ditemukan." };
  refresh();
  return { pesan: terbit ? "Ujian diterbitkan: peserta kelas ini akan melihatnya sesuai jadwal." : "Ujian kembali menjadi draf." };
}

export async function hapusUjian(id: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id)) return { galat: "Ujian tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data: audio } = await supabase.from("audio_ujian").select("path").eq("ujian_id", id);
  const { data, error } = await supabase.from("ujian").delete().eq("id", id).select("id");
  if (error?.message.includes("foreign key") || error?.message.includes("sudah dikerjakan peserta")) {
    return { galat: "Ujian sudah dikerjakan peserta, jadi tidak bisa dihapus. Jadikan draf bila tidak ingin terlihat." };
  }
  if (error || !data?.length) return { galat: "Ujian gagal dihapus." };
  if (audio?.length) await supabase.storage.from(BUCKET_AUDIO).remove(audio.map((a) => a.path));
  redirect("/ujian?pesan=dihapus");
}

// ===== Soal =====

export async function simpanSoal(
  ujianId: string,
  soalId: string | null,
  _: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(ujianId) || (soalId !== null && !idValid(soalId))) return { galat: "Soal tidak ditemukan." };
  const hasil = skemaSoal.safeParse({
    urutan: formData.get("urutan"),
    jenis: formData.get("jenis"),
    pertanyaan: formData.get("pertanyaan"),
    opsi: formData.getAll("opsi"),
    jawabanBenar: formData.get("jawabanBenar") ?? "",
    kunciIsian: formData.get("kunciIsian") ?? "",
    audioId: formData.get("audioId") ?? "",
    bobot: formData.get("bobot"),
  });
  if (!hasil.success) {
    const jalur = hasil.error.issues[0]?.path[0];
    if (jalur === "opsi") return { galat: "Pilihan ganda butuh minimal 2 pilihan, tanpa pilihan kosong di tengah." };
    if (jalur === "jawabanBenar") return { galat: "Pilih kunci jawaban dari pilihan yang terisi." };
    return { galat: "Periksa isian: pertanyaan wajib diisi, nomor 1–500, bobot 1–100." };
  }
  const d = hasil.data;
  const pilihanGanda = d.jenis === "pilihan_ganda";
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_soal", {
    p_soal_id: soalId as string, // null = soal baru
    p_ujian_id: ujianId,
    p_urutan: d.urutan,
    p_jenis: d.jenis,
    p_pertanyaan: d.pertanyaan,
    p_opsi: pilihanGanda ? d.opsi : (null as unknown as string[]),
    p_audio_id: d.audioId as string,
    p_bobot: d.bobot,
    p_jawaban_benar: pilihanGanda ? (d.jawabanBenar as number) : (null as unknown as number),
    p_kunci_isian: pilihanGanda ? "" : (d.kunciIsian ?? ""),
  });
  if (error) {
    if (error.message.includes("sudah dikerjakan peserta")) return { galat: GALAT_TERKUNCI };
    if (error.message.includes("foreign key")) return { galat: "Audio tidak ditemukan di ujian ini. Muat ulang halaman." };
    return { galat: "Soal gagal disimpan." };
  }
  redirect(`/ujian/${ujianId}?pesan=disimpan#soal`);
}

export async function hapusSoal(ujianId: string, soalId: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(ujianId) || !idValid(soalId)) return { galat: "Soal tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("soal").delete().eq("id", soalId).eq("ujian_id", ujianId).select("id");
  if (error?.message.includes("sudah dikerjakan peserta")) return { galat: GALAT_TERKUNCI };
  if (error || !data?.length) return { galat: "Soal gagal dihapus." };
  redirect(`/ujian/${ujianId}?pesan=dihapus#soal`);
}

// ===== Audio =====
// Berkas diunggah browser LANGSUNG ke Storage (batas body Vercel 4,5 MB), memakai tautan unggah sekali pakai
// yang dibuat di sini setelah peran admin diperiksa. Batas 10 MB dan jenis berkas juga ditegakkan bucket.

export async function siapkanUnggahAudio(
  ujianId: string,
  berkas: { judul: string; jenis: string; ukuran: number },
): Promise<{ galat?: string; path?: string; url?: string }> {
  await wajibPeran("admin");
  if (!idValid(ujianId)) return { galat: "Ujian tidak ditemukan." };
  const hasil = skemaUnggahAudio.safeParse(berkas);
  if (!hasil.success) return { galat: "Berkas harus MP3 atau M4A, maksimal 10 MB, dan judul wajib diisi." };
  const supabase = await buatKlienServer();
  const { count } = await supabase.from("ujian").select("id", { count: "exact", head: true }).eq("id", ujianId);
  if (!count) return { galat: "Ujian tidak ditemukan." };

  const path = `${ujianId}/${randomUUID()}.${JENIS_AUDIO[hasil.data.jenis]}`;
  const { data, error } = await supabase.storage.from(BUCKET_AUDIO).createSignedUploadUrl(path);
  if (error) return { galat: "Unggahan gagal disiapkan. Coba lagi." };
  return { path, url: data.signedUrl };
}

export async function simpanAudio(ujianId: string, path: string, judul: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  const judulBersih = typeof judul === "string" ? judul.trim() : "";
  if (!idValid(ujianId) || typeof path !== "string" || !path.startsWith(`${ujianId}/`) || !judulBersih) {
    return { galat: "Data audio tidak valid." };
  }
  // Ukuran diambil dari Storage (bukan dari klien); sekaligus memastikan berkas benar-benar terunggah.
  const supabase = await buatKlienServer();
  const nama = path.slice(ujianId.length + 1);
  const { data: daftar } = await supabase.storage.from(BUCKET_AUDIO).list(ujianId, { search: nama });
  const berkas = daftar?.find((b) => b.name === nama);
  const ukuran = Number(berkas?.metadata?.size ?? 0);
  if (!berkas || !ukuran) return { galat: "Berkas audio tidak ditemukan di penyimpanan. Unggah ulang." };

  const { error } = await supabase.from("audio_ujian").insert({ ujian_id: ujianId, judul: judulBersih.slice(0, 200), path, ukuran });
  if (error) {
    await supabase.storage.from(BUCKET_AUDIO).remove([path]);
    return { galat: "Audio gagal disimpan." };
  }
  refresh();
  return { pesan: "Audio diunggah." };
}

export async function hapusAudio(ujianId: string, audioId: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(ujianId) || !idValid(audioId)) return { galat: "Audio tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("audio_ujian")
    .delete()
    .eq("id", audioId)
    .eq("ujian_id", ujianId)
    .select("path");
  if (error) {
    if (error.message.includes("foreign key")) return { galat: "Audio masih dipakai soal. Lepaskan dari soal dulu." };
    return { galat: "Audio gagal dihapus." };
  }
  if (!data?.length) return { galat: "Audio tidak ditemukan." };
  await supabase.storage.from(BUCKET_AUDIO).remove(data.map((a) => a.path));
  refresh();
  return { pesan: "Audio dihapus." };
}

// ===== Duplikat =====
// Salin ujian (soal, kunci, bobot, audio) menjadi draf baru dengan judul/kelas/waktu dari form.
// Soal + kunci disimpan atomik lewat impor_soal(); bila ada langkah gagal, salinan dan berkasnya dihapus lagi.
export async function duplikatUjian(sumberId: string, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(sumberId)) return { galat: "Ujian tidak ditemukan." };
  const hasil = skemaUjian.safeParse({
    judul: formData.get("judul"),
    keterangan: formData.get("keterangan") ?? "",
    kelasId: formData.get("kelasId"),
    mulai: formData.get("mulai"),
    selesai: formData.get("selesai"),
    durasiMenit: formData.get("durasiMenit"),
    acakSoal: formData.get("acakSoal") === "on",
    acakOpsi: formData.get("acakOpsi") === "on",
  });
  if (!hasil.success) {
    return { galat: "Periksa isian: judul, kelas, waktu mulai/selesai (selesai setelah mulai), durasi 1–600 menit." };
  }
  const d = hasil.data;
  const supabase = await buatKlienServer();
  const { data: sumber } = await supabase
    .from("ujian")
    .select("id, soal(urutan, jenis, pertanyaan, opsi, audio_id, bobot, soal_kunci(jawaban_benar, kunci_isian)), audio_ujian(id, judul, path, ukuran)")
    .eq("id", sumberId)
    .maybeSingle();
  if (!sumber) return { galat: "Ujian tidak ditemukan." };
  if (sumber.soal.length > 300) return { galat: "Ujian dengan lebih dari 300 soal tidak bisa diduplikat." };

  const z_ = await zona(supabase);
  const { data: baru, error } = await supabase
    .from("ujian")
    .insert({
      judul: d.judul,
      keterangan: d.keterangan,
      kelas_id: d.kelasId,
      mulai: lokalKeIso(d.mulai, z_),
      selesai: lokalKeIso(d.selesai, z_),
      durasi_menit: d.durasiMenit,
      acak_soal: d.acakSoal,
      acak_opsi: d.acakOpsi,
    })
    .select("id")
    .single();
  if (error) return { galat: "Salinan gagal dibuat." };

  const berkasBaru: string[] = [];
  const batal = async (pesan: string): Promise<StatusAksi> => {
    if (berkasBaru.length) await supabase.storage.from(BUCKET_AUDIO).remove(berkasBaru);
    await supabase.from("ujian").delete().eq("id", baru.id);
    return { galat: pesan };
  };

  // Audio: salin berkas ke folder ujian baru, lalu catat barisnya.
  const petaAudio = new Map<string, string>();
  for (const a of sumber.audio_ujian) {
    const path = `${baru.id}/${randomUUID()}.${a.path.split(".").pop()}`;
    const { error: galatSalin } = await supabase.storage.from(BUCKET_AUDIO).copy(a.path, path);
    if (galatSalin) return batal("Audio gagal disalin. Coba lagi.");
    berkasBaru.push(path);
    const { data: barisAudio, error: galatAudio } = await supabase
      .from("audio_ujian")
      .insert({ ujian_id: baru.id, judul: a.judul, path, ukuran: a.ukuran })
      .select("id")
      .single();
    if (galatAudio) return batal("Audio gagal disalin. Coba lagi.");
    petaAudio.set(a.id, barisAudio.id);
  }

  if (sumber.soal.length) {
    const { error: galatSoal } = await supabase.rpc("impor_soal", {
      p_ujian_id: baru.id,
      p_baris: [...sumber.soal]
        .sort((a, b) => a.urutan - b.urutan)
        .map((s) => ({
          urutan: s.urutan,
          jenis: s.jenis,
          pertanyaan: s.pertanyaan,
          opsi: s.opsi,
          audio_id: s.audio_id ? (petaAudio.get(s.audio_id) ?? null) : null,
          bobot: s.bobot,
          jawaban_benar: s.soal_kunci?.jawaban_benar ?? null,
          kunci_isian: s.soal_kunci?.kunci_isian ?? null,
        })),
    });
    if (galatSoal) return batal("Soal gagal disalin. Coba lagi.");
  }
  redirect(`/ujian/${baru.id}?pesan=disalin`);
}
