import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, Memuat } from "@/components/halaman";
import { TombolMeet } from "@/components/portal/tombol-meet";
import { Chip } from "@/components/tabel";
import { jadwalKelasSaya } from "@/lib/data/portal-peserta";
import { formatJam, namaHari } from "@/lib/format";

export const metadata: Metadata = { title: "Jadwal kelas" };

export default function HalamanJadwalKelas() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Jadwal Kelas</h1>
      <Suspense fallback={<Memuat />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  const { waktu, jadwal } = await jadwalKelasSaya();
  if (jadwal.length === 0) {
    return (
      <Kartu>
        <p className="text-sm text-muted-foreground">Anda belum terdaftar di kelas yang memiliki jadwal.</p>
      </Kartu>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {jadwal.map((j) => {
        const hariIni = j.hari === waktu.hari;
        return (
          <li key={j.jadwal_id} className={`flex flex-col gap-2 rounded-3xl p-5 shadow-sm ${hariIni ? "bg-pastel-kuning" : "bg-card"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-judul text-lg">{j.kelas}</span>
              {hariIni && <Chip warna="hijau">Hari ini</Chip>}
            </div>
            <span className="text-sm">
              {namaHari(j.hari)}, {formatJam(j.jam_mulai)}–{formatJam(j.jam_selesai)} · {j.tutor}
            </span>
            {j.meet_url ? (
              <TombolMeet url={j.meet_url} kelas={j.kelas} />
            ) : (
              <span className="text-xs text-muted-foreground">Tautan Meet belum diatur tutor.</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
