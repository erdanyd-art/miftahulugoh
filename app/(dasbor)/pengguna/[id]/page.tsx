import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FormUbahPengguna, TombolKirimTautan, TombolStatusAktif } from "@/components/pengguna/form-pengguna";
import { Chip } from "@/components/tabel";
import { ubahPengguna } from "@/lib/aksi-pengguna";
import { wajibPeran } from "@/lib/auth";
import { ambilPengguna } from "@/lib/data/pengguna";

export const metadata: Metadata = { title: "Ubah pengguna" };

export default function HalamanUbahPengguna({ params }: PageProps<"/pengguna/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/pengguna" className="text-sm font-medium text-accent hover:underline">
        ← Kembali ke daftar pengguna
      </Link>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
        <Isi params={params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const saya = await wajibPeran("admin");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const pengguna = await ambilPengguna(id);
  if (!pengguna) notFound();
  const diriSendiri = pengguna.id === saya.id;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{pengguna.nama}</h1>
        <Chip warna={pengguna.aktif ? "hijau" : "merah"}>{pengguna.aktif ? "Aktif" : "Nonaktif"}</Chip>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">{pengguna.email}</p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Data pengguna</h2>
          <FormUbahPengguna
            aksiUbah={ubahPengguna.bind(null, pengguna.id)}
            nama={pengguna.nama}
            peran={pengguna.peran}
            diriSendiri={diriSendiri}
          />
        </section>

        <section className="flex flex-col gap-6 rounded-3xl bg-card p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Kata sandi</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Kirim tautan agar pengguna membuat atau mengganti kata sandinya sendiri.
            </p>
            <TombolKirimTautan id={pengguna.id} />
          </div>
          {!diriSendiri && (
            <div>
              <h2 className="text-lg font-semibold">Status akun</h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Akun tidak dihapus; nonaktifkan bila pengguna tidak lagi bertugas.
              </p>
              <TombolStatusAktif id={pengguna.id} aktif={pengguna.aktif} nama={pengguna.nama} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
