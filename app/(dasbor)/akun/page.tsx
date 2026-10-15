import type { Metadata } from "next";
import { Suspense } from "react";
import { FormGantiSandi } from "@/components/auth/form-auth";
import { penggunaWajib } from "@/lib/auth";

export const metadata: Metadata = { title: "Akun saya" };

// Untuk semua peran: ganti kata sandi sendiri tanpa email (cukup kata sandi lama).
export default function HalamanAkun() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Akun saya</h1>
      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-lg">Ganti kata sandi</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <Isi />
        </Suspense>
      </section>
    </div>
  );
}

async function Isi() {
  const pengguna = await penggunaWajib();
  return (
    <>
      <p className="mb-5 text-sm text-muted-foreground">
        Masuk sebagai {pengguna.nama}. Lupa kata sandi lama? Minta admin mengirim tautan atur ulang.
      </p>
      <FormGantiSandi />
    </>
  );
}
