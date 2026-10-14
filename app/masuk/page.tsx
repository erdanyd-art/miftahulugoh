import type { Metadata } from "next";
import { Suspense } from "react";
import { BingkaiAuth, PesanStatus } from "@/components/auth/bingkai-auth";
import { FormMasuk } from "@/components/auth/form-auth";

export const metadata: Metadata = { title: "Masuk" };

const PESAN_GALAT: Record<string, string> = {
  tautan: "Tautan sudah tidak berlaku. Minta tautan baru lewat “Lupa kata sandi?”.",
};

// Pesan dari URL (?galat=...) dibaca saat permintaan, jadi dibungkus <Suspense> terpisah dari form.
async function PesanDariUrl({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const { galat } = await searchParams;
  const pesan = typeof galat === "string" ? PESAN_GALAT[galat] : undefined;
  return pesan ? <div className="mb-4"><PesanStatus galat={pesan} /></div> : null;
}

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  return (
    <BingkaiAuth judul="Masuk" keterangan="Gunakan akun yang dibuat oleh admin lembaga.">
      <Suspense fallback={null}>
        <PesanDariUrl searchParams={searchParams} />
      </Suspense>
      <FormMasuk />
    </BingkaiAuth>
  );
}
