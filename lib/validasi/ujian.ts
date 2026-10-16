import { z } from "zod";

const waktuLokal = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const teksOpsional = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => v || null);

export const skemaUjian = z
  .object({
    judul: z.string().trim().min(1).max(200),
    keterangan: teksOpsional,
    kelasId: z.guid(),
    mulai: waktuLokal,
    selesai: waktuLokal,
    durasiMenit: z.coerce.number().int().min(1).max(600),
  })
  .refine((d) => d.selesai > d.mulai, { path: ["selesai"] });

export const BATAS_OPSI = 6;
export const HURUF_OPSI = ["A", "B", "C", "D", "E", "F"];

export const skemaSoal = z
  .object({
    urutan: z.coerce.number().int().min(1).max(500),
    jenis: z.enum(["pilihan_ganda", "isian"]),
    pertanyaan: z.string().trim().min(1).max(5000),
    // Opsi kosong di akhir diabaikan; opsi kosong di tengah ditolak (huruf kunci jadi bergeser).
    opsi: z.array(z.string().trim().max(1000)).max(BATAS_OPSI),
    jawabanBenar: z.union([z.literal("").transform(() => null), z.coerce.number().int().min(0).max(BATAS_OPSI - 1)]),
    kunciIsian: teksOpsional,
    audioId: z.union([z.literal("").transform(() => null), z.guid()]),
    bobot: z.coerce.number().int().min(1).max(100),
  })
  .transform((d) => {
    const opsi = [...d.opsi];
    while (opsi.length && !opsi[opsi.length - 1]) opsi.pop();
    return { ...d, opsi };
  })
  .refine((d) => d.jenis === "isian" || (d.opsi.length >= 2 && d.opsi.every(Boolean)), {
    message: "opsi",
    path: ["opsi"],
  })
  .refine((d) => d.jenis === "isian" || (d.jawabanBenar !== null && d.jawabanBenar < d.opsi.length), {
    message: "kunci",
    path: ["jawabanBenar"],
  });

export const BATAS_AUDIO = 10 * 1024 * 1024;
// Jenis berkas -> ekstensi. Sama dengan allowed_mime_types bucket audio-ujian.
export const JENIS_AUDIO: Record<string, "mp3" | "m4a"> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
};

export const skemaUnggahAudio = z.object({
  judul: z.string().trim().min(1).max(200),
  jenis: z.string().refine((j) => j in JENIS_AUDIO),
  ukuran: z.number().int().min(1).max(BATAS_AUDIO),
});
