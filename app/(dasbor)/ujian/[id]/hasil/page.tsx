import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Memuat, TautanKembali } from "@/components/halaman";
import { HasilUjian } from "@/components/ujian/hasil-ujian";
import { wajibPeran } from "@/lib/auth";
import { ambilHasil } from "@/lib/data/penilaian";

export const metadata: Metadata = { title: "Hasil ujian" };

export default function HalamanHasilUjian({ params }: PageProps<"/ujian/[id]/hasil">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await wajibPeran("admin");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const data = await ambilHasil(id);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}`} label="Kembali ke ujian" />
      <HasilUjian data={data} admin />
    </div>
  );
}
