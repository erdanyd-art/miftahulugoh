import { Chip } from "@/components/tabel";

// Status tampilan dari jadwal + terbit. Penegakan waktu ujian ada di database (Sprint 11).
export function statusUjian(u: { terbit: boolean; mulai: string; selesai: string }, sekarang = Date.now()) {
  if (!u.terbit) return { label: "Draf", warna: "netral" as const };
  if (sekarang < Date.parse(u.mulai)) return { label: "Terjadwal", warna: "kuning" as const };
  if (sekarang < Date.parse(u.selesai)) return { label: "Berlangsung", warna: "hijau" as const };
  return { label: "Selesai", warna: "netral" as const };
}

export function ChipStatusUjian({ ujian }: { ujian: { terbit: boolean; mulai: string; selesai: string } }) {
  const s = statusUjian(ujian);
  return <Chip warna={s.warna}>{s.label}</Chip>;
}
