import type { Metadata } from "next";
import { BingkaiAuth } from "@/components/auth/bingkai-auth";
import { FormLupaSandi } from "@/components/auth/form-auth";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function HalamanLupaSandi() {
  return (
    <BingkaiAuth judul="Lupa kata sandi" keterangan="Kami kirimkan tautan untuk membuat kata sandi baru ke email Anda.">
      <FormLupaSandi />
    </BingkaiAuth>
  );
}
