import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormTambahPengguna } from "@/components/pengguna/form-pengguna";
import { wajibPeran } from "@/lib/auth";

export const metadata: Metadata = { title: "Tambah pengguna" };

export default function HalamanTambahPengguna() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/pengguna" className="text-sm font-medium text-accent hover:underline">
        ← Kembali ke daftar pengguna
      </Link>
      <h1 className="text-2xl font-semibold">Tambah pengguna</h1>
      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <Suspense fallback={null}>
          <Isi />
        </Suspense>
      </section>
    </div>
  );
}

async function Isi() {
  await wajibPeran("admin");
  return <FormTambahPengguna />;
}
