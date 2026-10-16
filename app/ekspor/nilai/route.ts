import type { NextRequest } from "next/server";
import { z } from "zod";
import { keCsv, responsCsv } from "@/lib/csv";
import { ambilHasil } from "@/lib/data/penilaian";

// Ekspor nilai satu ujian. ambilHasil() memeriksa peran staf; fungsi database membatasi tutor ke kelas yang diampu.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("ujian") ?? "";
  if (!z.guid().safeParse(id).success) return new Response("Ujian tidak ditemukan", { status: 404 });
  const data = await ambilHasil(id);
  if (!data) return new Response("Ujian tidak ditemukan", { status: 404 });
  const isi = keCsv(
    ["Peserta", "Status", "Skor pilihan ganda", "Skor isian", "Isian belum dinilai", "Total bobot", "Nilai (0-100)"],
    data.hasil.map((h) => [
      h.nama,
      !h.percobaan_id ? "Tidak mengerjakan" : h.selesai_pada ? "Selesai" : "Mengerjakan",
      h.percobaan_id ? h.skor_pg : null,
      h.percobaan_id ? h.skor_isian : null,
      h.percobaan_id ? h.isian_belum : null,
      h.total_bobot,
      h.nilai,
    ]),
  );
  return responsCsv(`nilai-${data.info.judul}.csv`, isi);
}
