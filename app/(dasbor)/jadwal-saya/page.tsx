import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { FormMeet } from "@/components/master/form-master";
import { Chip } from "@/components/tabel";
import { ubahMeet } from "@/lib/aksi-master";
import { wajibPeran } from "@/lib/auth";
import { jadwalSaya } from "@/lib/data/master";
import { formatJam, namaHari } from "@/lib/format";

export const metadata: Metadata = { title: "Jadwal Saya" };

export default function HalamanJadwalSaya() {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Jadwal Saya" />
      <Suspense fallback={<Memuat />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  await wajibPeran("tutor");
  const jadwal = await jadwalSaya();
  if (jadwal.length === 0) {
    return (
      <Kartu>
        <p className="text-sm text-muted-foreground">Anda belum memiliki jadwal. Hubungi admin lembaga.</p>
      </Kartu>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {jadwal.map((j) => (
        <li key={j.id}>
          <Kartu className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {namaHari(j.hari)} · {formatJam(j.jam_mulai)}–{formatJam(j.jam_selesai)}
                </p>
                <h2 className="text-lg">{j.kelas?.nama}</h2>
              </div>
              <Chip warna={j.aktif ? "hijau" : "merah"}>{j.aktif ? "Aktif" : "Nonaktif"}</Chip>
            </div>
            {j.meet_url && (
              <a
                href={j.meet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                Buka Google Meet
              </a>
            )}
            <FormMeet aksi={ubahMeet.bind(null, j.id)} awal={j.meet_url} />
          </Kartu>
        </li>
      ))}
    </ul>
  );
}
