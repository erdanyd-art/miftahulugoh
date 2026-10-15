import type { Metadata } from "next";
import { BingkaiAuth } from "@/components/auth/bingkai-auth";
import { FormAturSandi } from "@/components/auth/form-auth";

export const metadata: Metadata = { title: "Atur kata sandi" };

// Dibuka dari tautan email (sesi sudah dibuat oleh /auth/callback); proxy menolak tanpa sesi.
export default function HalamanAturSandi() {
  return (
    <BingkaiAuth judul="Atur kata sandi" keterangan="Buat kata sandi baru untuk akun Anda.">
      <FormAturSandi />
    </BingkaiAuth>
  );
}
