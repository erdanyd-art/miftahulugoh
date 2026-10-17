import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Memuat, TautanKembali } from "@/components/halaman";
import { JawabanPeserta } from "@/components/ujian/jawaban-peserta";
import { wajibPeran } from "@/lib/auth";
import { ambilJawabanPercobaan } from "@/lib/data/penilaian";

export const metadata: Metadata = { title: "Jawaban peserta" };

export default function HalamanJawabanPeserta({ params }: PageProps<"/ujian/[id]/hasil/[percobaanId]">) {
  return (
    <Suspense fallback={<Memuat />}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string; percobaanId: string }> }) {
  await wajibPeran("admin");
  const { id, percobaanId } = await params;
  if (!z.guid().safeParse(id).success || !z.guid().safeParse(percobaanId).success) notFound();
  const data = await ambilJawabanPercobaan(percobaanId); // null bila tidak berwenang / tidak ada
  if (!data || data.info.ujian_id !== id) notFound();
  return (
    <div className="flex flex-col gap-6">
      <TautanKembali href={`/ujian/${id}/hasil`} label="Kembali ke hasil ujian" />
      <JawabanPeserta data={data} />
    </div>
  );
}
