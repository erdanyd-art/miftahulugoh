import { Suspense } from "react";
import { penggunaWajib, wajibPeran } from "@/lib/auth";
import type { Peran } from "@/lib/nav";

// Halaman menu yang belum dibangun. Peran tetap diperiksa di server sebelum isi ditampilkan.
// untuk: peran yang boleh membuka; kosong = semua pengguna aktif.
export function HalamanSegera({ judul, sprint, untuk }: { judul: string; sprint: number; untuk?: Peran }) {
  return (
    <Suspense fallback={null}>
      <Isi judul={judul} sprint={sprint} untuk={untuk} />
    </Suspense>
  );
}

async function Isi({ judul, sprint, untuk }: { judul: string; sprint: number; untuk?: Peran }) {
  if (untuk) await wajibPeran(untuk);
  else await penggunaWajib();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{judul}</h1>
      <section className="rounded-3xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Halaman ini sedang dibangun (Sprint {sprint}).</p>
      </section>
    </div>
  );
}
