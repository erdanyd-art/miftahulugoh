import type { Metadata } from "next";
import { BingkaiAuth } from "@/components/auth/bingkai-auth";
import { Button } from "@/components/ui/button";
import { keluar } from "@/lib/aksi-auth";

export const metadata: Metadata = { title: "Akun tidak aktif" };

export default function HalamanAkunTidakAktif() {
  return (
    <BingkaiAuth
      judul="Akun tidak aktif"
      keterangan="Akun Anda belum terdaftar atau sudah dinonaktifkan. Hubungi admin lembaga untuk mengaktifkannya."
    >
      <form action={keluar}>
        <Button type="submit" className="h-11 w-full rounded-full text-base">
          Keluar
        </Button>
      </form>
    </BingkaiAuth>
  );
}
