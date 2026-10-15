import { z } from "zod";

const nama = z.string().trim().min(1).max(100);
const peran = z.enum(["admin", "tutor"]);

export const skemaPenggunaBaru = z.object({ nama, email: z.email().max(200), peran });
export const skemaUbahPengguna = z.object({ nama, peran });

// Zona waktu lembaga yang ditawarkan di form. Database tetap memvalidasi nama IANA apa pun.
export const ZONA_WAKTU = [
  { nilai: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { nilai: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { nilai: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
] as const;

export function zonaWaktuValid(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("id-ID", { timeZone: zona });
    return zona.includes("/") || zona === "UTC";
  } catch {
    return false;
  }
}

export const skemaPengaturan = z.object({
  namaLembaga: z.string().trim().min(1).max(150),
  zonaWaktu: z.string().refine(zonaWaktuValid),
});
