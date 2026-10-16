"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { BATAS_UKURAN } from "@/lib/impor-csv";
import { uraiSoal } from "@/lib/impor-soal";
import { buatKlienServer } from "@/lib/supabase/server";

export type BarisPratinjauSoal = {
  baris: number;
  nomor: number;
  jenis: "pilihan_ganda" | "isian";
  pertanyaan: string;
  opsi: string[];
  kunci: number | null;
  acuan: string;
  bobot: number;
  audio: string;
  galat?: string;
};
export type HasilPeriksaSoal = { galat?: string; pesan?: string; baris?: BarisPratinjauSoal[]; siap?: number; bermasalah?: number };

// Aturan impor di satu tempat: dipakai untuk pratinjau DAN diulang saat impor (data klien tidak dipercaya).
async function evaluasi(ujianId: string, teks: unknown) {
  if (!z.guid().safeParse(ujianId).success) return { galat: "Ujian tidak ditemukan." } as const;
  if (typeof teks !== "string" || teks.length === 0) return { galat: "Pilih berkas CSV terlebih dahulu." } as const;
  if (new TextEncoder().encode(teks).length > BATAS_UKURAN) return { galat: "Berkas terlalu besar (maksimal 500 KB)." } as const;
  const { data, galat } = uraiSoal(teks);
  if (galat) return { galat } as const;
  if (data.length === 0) return { galat: "Tidak ada baris soal di bawah judul kolom." } as const;

  const supabase = await buatKlienServer();
  const { data: ujian } = await supabase
    .from("ujian")
    .select("id, soal(urutan), audio_ujian(id, judul), percobaan_ujian(id)")
    .eq("id", ujianId)
    .maybeSingle();
  if (!ujian) return { galat: "Ujian tidak ditemukan." } as const;
  if (ujian.percobaan_ujian.length) return { galat: "Ujian sudah dikerjakan peserta; soal tidak bisa ditambah." } as const;

  const audioPer = new Map(ujian.audio_ujian.map((a) => [a.judul.trim().toLowerCase(), a.id]));
  let nomor = ujian.soal.reduce((n, s) => Math.max(n, s.urutan), 0);
  const baris = data.map((b) => {
    const urutan = b.nomor ?? Math.min(500, ++nomor);
    if (b.nomor) nomor = Math.max(nomor, b.nomor);
    const audioId = b.audio ? audioPer.get(b.audio.toLowerCase()) : undefined;
    const galatAudio = b.audio && !audioId ? `Audio "${b.audio}" belum diunggah di ujian ini` : undefined;
    return { ...b, nomor: urutan, audioId: audioId ?? null, galat: b.galat ?? galatAudio };
  });
  const bermasalah = baris.filter((b) => b.galat).length;
  return { baris, siap: baris.length - bermasalah, bermasalah } as const;
}

export async function periksaImporSoal(ujianId: string, teks: string): Promise<HasilPeriksaSoal> {
  await wajibPeran("admin");
  const hasil = await evaluasi(ujianId, teks);
  if ("galat" in hasil) return { galat: hasil.galat };
  return {
    // ID audio tidak perlu dikirim ke browser
    baris: hasil.baris.map((b) => ({
      baris: b.baris,
      nomor: b.nomor,
      jenis: b.jenis,
      pertanyaan: b.pertanyaan,
      opsi: b.opsi,
      kunci: b.kunci,
      acuan: b.acuan,
      bobot: b.bobot,
      audio: b.audio,
      galat: b.galat,
    })),
    siap: hasil.siap,
    bermasalah: hasil.bermasalah,
  };
}

export async function imporSoal(ujianId: string, teks: string): Promise<HasilPeriksaSoal> {
  await wajibPeran("admin");
  const hasil = await evaluasi(ujianId, teks);
  if ("galat" in hasil) return { galat: hasil.galat };
  if (hasil.bermasalah > 0) return { galat: "Masih ada baris bermasalah. Perbaiki berkasnya lalu periksa ulang." };

  const supabase = await buatKlienServer();
  const { data: jumlah, error } = await supabase.rpc("impor_soal", {
    p_ujian_id: ujianId,
    p_baris: hasil.baris.map((b) => ({
      urutan: b.nomor,
      jenis: b.jenis,
      pertanyaan: b.pertanyaan,
      opsi: b.jenis === "pilihan_ganda" ? b.opsi : null,
      audio_id: b.audioId,
      bobot: b.bobot,
      jawaban_benar: b.jenis === "pilihan_ganda" ? b.kunci : null,
      kunci_isian: b.jenis === "isian" ? b.acuan : null,
    })),
  });
  if (error) {
    if (error.message.includes("sudah dikerjakan peserta")) return { galat: "Ujian sudah dikerjakan peserta; soal tidak bisa ditambah." };
    return { galat: "Impor gagal; tidak ada soal yang disimpan. Coba lagi." };
  }
  refresh();
  return { pesan: `${jumlah} soal berhasil diimpor.` };
}
