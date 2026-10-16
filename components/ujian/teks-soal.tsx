import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ARAB = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function adaArab(teks: string): boolean {
  return ARAB.test(teks);
}

// Teks soal/opsi: arah mengikuti isi (dir="auto"); bila memuat huruf Arab, huruf diperbesar agar harakat terbaca.
export function TeksSoal({ teks, className, children }: { teks: string; className?: string; children?: ReactNode }) {
  return (
    <span dir="auto" className={cn("whitespace-pre-wrap", adaArab(teks) && "text-xl leading-loose", className)}>
      {teks}
      {children}
    </span>
  );
}
