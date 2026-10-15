"use server";

import { refresh } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { BATAS_UKURAN, uraiPeserta } from "@/lib/impor-csv";
import { buatKlienServer } from "@/lib/supabase/server";

export type StatusBaris = "siap" | "lewati" | "galat";
export type BarisPratinjau = { baris: number; nama: string; catatan: string; kelas: string[]; status: StatusBaris; alasan?: string };
export type HasilPeriksa = {
  galat?: string;
  pesan?: string;
  baris?: BarisPratinjau[];
  ringkas?: Record<StatusBaris, number>;
};

// Satu-satunya tempat aturan impor: dipakai untuk pratinjau DAN diulang saat impor (data klien tidak dipercaya).
async function evaluasi(teks: unknown) {
  if (typeof teks !== "string" || teks.length === 0) return { galat: "Pilih berkas CSV terlebih dahulu." } as const;
  if (new TextEncoder().encode(teks).length > BATAS_UKURAN) return { galat: "Berkas terlalu besar (maksimal 500 KB)." } as const;
  const { data, galat } = uraiPeserta(teks);
  if (galat) return { galat } as const;
  if (data.length === 0) return { galat: "Tidak ada baris peserta di bawah judul kolom." } as const;

  const supabase = await buatKlienServer();
  const [{ data: peserta }, { data: kelas }] = await Promise.all([
    supabase.from("peserta").select("nama"),
    supabase.from("kelas").select("id, nama"),
  ]);
  const sudahAda = new Set((peserta ?? []).map((p) => p.nama.toLowerCase()));
  const kelasPer = new Map((kelas ?? []).map((k) => [k.nama.toLowerCase(), k.id]));
  const dalamBerkas = new Map<string, number>();

  const baris: (BarisPratinjau & { kelasIds: string[] })[] = data.map((b) => {
    const dasar = { ...b, kelasIds: [] as string[] };
    const kunci = b.nama.toLowerCase();
    if (!b.nama) return { ...dasar, status: "galat", alasan: "Nama kosong" };
    if (b.nama.length > 100) return { ...dasar, status: "galat", alasan: "Nama lebih dari 100 karakter" };
    if (b.catatan.length > 500) return { ...dasar, status: "galat", alasan: "Catatan lebih dari 500 karakter" };
    const tidakDikenal = b.kelas.filter((k) => !kelasPer.has(k.toLowerCase()));
    if (tidakDikenal.length) return { ...dasar, status: "galat", alasan: `Kelas tidak ditemukan: ${tidakDikenal.join(", ")}` };
    if (dalamBerkas.has(kunci)) return { ...dasar, status: "galat", alasan: `Nama sama dengan baris ${dalamBerkas.get(kunci)}` };
    dalamBerkas.set(kunci, b.baris);
    if (sudahAda.has(kunci)) return { ...dasar, status: "lewati", alasan: "Sudah ada di daftar peserta" };
    return { ...dasar, status: "siap", kelasIds: b.kelas.map((k) => kelasPer.get(k.toLowerCase())!) };
  });

  const ringkas = { siap: 0, lewati: 0, galat: 0 };
  for (const b of baris) ringkas[b.status] += 1;
  return { baris, ringkas } as const;
}

export async function periksaImpor(teks: string): Promise<HasilPeriksa> {
  await wajibPeran("admin");
  const hasil = await evaluasi(teks);
  if ("galat" in hasil) return { galat: hasil.galat };
  // kelasIds tidak dikirim ke browser
  const baris = hasil.baris.map((b) => ({ baris: b.baris, nama: b.nama, catatan: b.catatan, kelas: b.kelas, status: b.status, alasan: b.alasan }));
  return { baris, ringkas: hasil.ringkas };
}

export async function imporPeserta(teks: string): Promise<HasilPeriksa> {
  await wajibPeran("admin");
  const hasil = await evaluasi(teks);
  if ("galat" in hasil) return { galat: hasil.galat };
  if (hasil.ringkas.galat > 0) return { galat: "Masih ada baris bermasalah. Perbaiki berkasnya lalu periksa ulang." };
  const siap = hasil.baris.filter((b) => b.status === "siap");
  if (siap.length === 0) return { galat: "Tidak ada peserta baru untuk diimpor (semua sudah ada)." };

  const supabase = await buatKlienServer();
  const { data: jumlah, error } = await supabase.rpc("impor_peserta", {
    p_baris: siap.map((b) => ({ nama: b.nama, catatan: b.catatan, kelas_ids: b.kelasIds })),
  });
  if (error) return { galat: "Impor gagal; tidak ada data yang disimpan. Coba lagi." };
  refresh();
  const lewati = hasil.ringkas.lewati ? `, ${hasil.ringkas.lewati} dilewati karena sudah ada` : "";
  return { pesan: `${jumlah} peserta berhasil diimpor${lewati}.` };
}
