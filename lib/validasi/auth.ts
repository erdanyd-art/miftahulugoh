import { z } from "zod";

export const PANJANG_SANDI_MIN = 10; // sama dengan minimum_password_length di supabase/config.toml

export const skemaMasuk = z.object({
  email: z.email(),
  kataSandi: z.string().min(1).max(200),
});

export const skemaLupaSandi = z.object({
  email: z.email(),
});

export const skemaAturSandi = z
  .object({
    kataSandi: z.string().min(PANJANG_SANDI_MIN).max(200),
    ulangi: z.string(),
  })
  .refine((d) => d.kataSandi === d.ulangi, { path: ["ulangi"] });

export const skemaGantiSandi = z
  .object({
    sandiLama: z.string().min(1).max(200),
    kataSandi: z.string().min(PANJANG_SANDI_MIN).max(200),
    ulangi: z.string(),
  })
  .refine((d) => d.kataSandi === d.ulangi, { path: ["ulangi"] });

// Hanya izinkan pengalihan ke jalur internal ("/..."), bukan ke situs lain ("//..." atau "https://...").
export function jalurAman(nilai: string | null | undefined, cadangan = "/"): string {
  if (!nilai || !nilai.startsWith("/") || nilai.startsWith("//") || nilai.startsWith("/\\")) return cadangan;
  return nilai;
}
