import { z } from "zod";

export const PANJANG_SANDI_MIN = 10; // sama dengan minimum_password_length di supabase/config.toml

// Peserta (D11) masuk dengan username. Supabase Auth butuh email, jadi username dipetakan ke alamat
// di domain .invalid (dicadangkan RFC 2606: tidak pernah bisa menerima email).
export const DOMAIN_PESERTA = "peserta.miftah.invalid";
export const skemaUsername = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._]{2,29}$/);
export const emailPeserta = (username: string) => `${username}@${DOMAIN_PESERTA}`;
export const usernameDariEmail = (email: string) =>
  email.endsWith(`@${DOMAIN_PESERTA}`) ? email.slice(0, -DOMAIN_PESERTA.length - 1) : null;

// Isian "Email atau username": ada "@" = email staf, tanpa "@" = username peserta.
const skemaIdentitas = z.union([z.email(), skemaUsername.transform(emailPeserta)]);

export const skemaMasuk = z.object({
  email: skemaIdentitas,
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
