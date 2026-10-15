import { z } from "zod";

const teksOpsional = (maks: number) =>
  z
    .string()
    .trim()
    .max(maks)
    .transform((t) => (t === "" ? null : t));

const centang = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const skemaPeserta = z.object({
  nama: z.string().trim().min(1).max(100),
  catatan: teksOpsional(500),
  aktif: centang,
});

export const skemaKelas = z.object({
  nama: z.string().trim().min(1).max(100),
  keterangan: teksOpsional(300),
  aktif: centang,
});

// Tautan Meet: kosong, atau https:// tanpa spasi (sama dengan constraint database).
export const skemaMeet = z
  .string()
  .trim()
  .max(300)
  .refine((u) => u === "" || /^https:\/\/\S+$/.test(u))
  .transform((u) => (u === "" ? null : u));

const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

export const skemaJadwal = z
  .object({
    kelasId: z.guid(),
    tutorId: z.guid(),
    hari: z.coerce.number().int().min(1).max(7),
    jamMulai: jam,
    jamSelesai: jam,
    honor: z.coerce.number().int().min(0).max(100_000_000),
    meetUrl: skemaMeet,
    aktif: centang,
  })
  .refine((d) => d.jamSelesai.slice(0, 5) > d.jamMulai.slice(0, 5), { path: ["jamSelesai"] });
