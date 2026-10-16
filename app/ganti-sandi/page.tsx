import type { Metadata } from "next";
import { BingkaiAuth } from "@/components/auth/bingkai-auth";
import { FormGantiSandi } from "@/components/auth/form-auth";

export const metadata: Metadata = { title: "Ganti kata sandi" };

// Wajib setelah masuk pertama dengan kata sandi awal dari admin. Proxy menolak tanpa sesi;
// aksi gantiSandi memeriksa pengguna dan kata sandi lama di server.
export default function HalamanGantiSandi() {
  return (
    <BingkaiAuth
      judul="Ganti kata sandi"
      keterangan="Ini masuk pertama Anda. Ganti kata sandi awal dari admin dengan kata sandi milik Anda sendiri."
    >
      <FormGantiSandi />
    </BingkaiAuth>
  );
}
