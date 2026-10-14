import type { Metadata } from "next";
import Link from "next/link";
import { BingkaiAuth } from "@/components/auth/bingkai-auth";

export const metadata: Metadata = { title: "Tidak berwenang" };

export default function HalamanTidakBerwenang() {
  return (
    <BingkaiAuth judul="Tidak berwenang" keterangan="Halaman ini tidak tersedia untuk peran Anda.">
      <Link
        href="/"
        className="flex h-11 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground"
      >
        Kembali ke Dashboard
      </Link>
    </BingkaiAuth>
  );
}
