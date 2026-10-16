import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Memuat, TautanKembali } from "@/components/halaman";
import { HasilUjian } from "@/components/ujian/hasil-ujian";
import { wajibPeran } from "@/lib/auth";
import { ambilHasil } from "@/lib/data/penilaian";

export const metadata: Metadata = { title: "Periksa ujian" };

export default function HalamanPeriksaUjian({ params }: PageProps<"/periksa-ujian/[id]">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await wajibPeran("tutor");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const data = await ambilHasil(id); // null bila bukan kelas yang diampu
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href="/periksa-ujian" label="Kembali ke daftar ujian" />
      <HasilUjian data={data} admin={false} />
    </div>
  );
}
