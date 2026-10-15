import { z } from "zod";

const keteranganOpsional = z
  .string()
  .trim()
  .max(300)
  .transform((t) => (t === "" ? null : t));

const jumlah = z.coerce.number().int().min(1).max(1_000_000_000_000);

// Jenis kas tidak dikirim form: diambil dari kategori di server (database juga memeriksa kecocokannya).
export const skemaKas = z.object({
  tanggal: z.iso.date(),
  kategoriId: z.guid(),
  keterangan: keteranganOpsional,
  jumlah,
  tutorId: z
    .string()
    .transform((t) => (t === "" ? null : t))
    .pipe(z.guid().nullable()),
});

export const skemaPembayaran = z.object({
  tanggal: z.iso.date(),
  pesertaId: z.guid(),
  keterangan: z.string().trim().min(1).max(200),
  jumlah,
  status: z.enum(["lunas", "belum_lunas"]),
});

export const skemaKategori = z.object({
  nama: z.string().trim().min(1).max(60),
  jenis: z.enum(["pemasukan", "pengeluaran"]),
  butuhTutor: z.preprocess((v) => v === "on", z.boolean()),
});
