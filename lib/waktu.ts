// Waktu menurut zona lembaga (dari tabel pengaturan), bukan jam perangkat.
// Hanya untuk TAMPILAN (mis. menonaktifkan tombol Absen); jendela absen ditegakkan di database.
export type WaktuLembaga = { tanggal: string; hari: number; jam: string; bulan: string };

const HARI_ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function waktuDiZona(zona: string, saat: Date = new Date()): WaktuLembaga {
  const bagian = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(saat)
      .map((p) => [p.type, p.value]),
  );
  const tanggal = `${bagian.year}-${bagian.month}-${bagian.day}`;
  return { tanggal, hari: HARI_ISO[bagian.weekday] ?? 1, jam: `${bagian.hour}:${bagian.minute}`, bulan: tanggal.slice(0, 7) };
}

// Rentang tanggal satu bulan "YYYY-MM" -> [awal, awal bulan berikutnya)
export function rentangBulan(bulan: string): { dari: string; sampai: string } {
  const [t, b] = bulan.split("-").map(Number);
  const berikut = b === 12 ? `${t + 1}-01` : `${t}-${String(b + 1).padStart(2, "0")}`;
  return { dari: `${bulan}-01`, sampai: `${berikut}-01` };
}

export function bulanValid(bulan: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(bulan);
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function namaBulan(bulan: string): string {
  const [t, b] = bulan.split("-").map(Number);
  return `${NAMA_BULAN[b - 1]} ${t}`;
}

export function formatTanggal(tanggal: string): string {
  const [t, b, h] = tanggal.split("-").map(Number);
  return `${h} ${NAMA_BULAN[b - 1].slice(0, 3)} ${t}`;
}

// Daftar bulan "YYYY-MM" sebanyak `banyak`, berakhir di bulanAkhir (urut lama -> baru).
export function bulanMundur(bulanAkhir: string, banyak: number): string[] {
  const [t, b] = bulanAkhir.split("-").map(Number);
  return Array.from({ length: banyak }, (_, i) => {
    const d = new Date(Date.UTC(t, b - 1 - (banyak - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

// Awal hari (00:00) suatu tanggal di zona lembaga sebagai ISO dengan offset, mis. "2026-10-15T00:00:00+08:00".
export function awalHariDiZona(tanggal: string, zona: string): string {
  const nama = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${tanggal}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  const offset = nama && nama !== "GMT" ? nama.replace("GMT", "") : "+00:00";
  return `${tanggal}T00:00:00${offset}`;
}

export function tanggalBerikut(tanggal: string): string {
  return new Date(Date.parse(`${tanggal}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

// Offset zona (mis. "+08:00") pada suatu tanggal. Zona Indonesia tanpa DST, tetapi tetap dihitung per tanggal.
function offsetZona(tanggal: string, zona: string): string {
  const nama = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${tanggal}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  return nama && nama !== "GMT" ? nama.replace("GMT", "") : "+00:00";
}

// Isian <input type="datetime-local"> ("2026-11-01T08:00") yang dimaksud di zona lembaga -> ISO dengan offset.
export function lokalKeIso(lokal: string, zona: string): string {
  return `${lokal.slice(0, 16)}:00${offsetZona(lokal.slice(0, 10), zona)}`;
}

// Kebalikan lokalKeIso: timestamptz -> nilai datetime-local di zona lembaga.
export function isoKeLokal(iso: string, zona: string): string {
  const w = waktuDiZona(zona, new Date(iso));
  return `${w.tanggal}T${w.jam}`;
}

// Tampilan tanggal + jam di zona lembaga, mis. "1 Nov 2026 08.00".
export function formatWaktu(iso: string, zona: string): string {
  const w = waktuDiZona(zona, new Date(iso));
  return `${formatTanggal(w.tanggal)} ${w.jam.replace(":", ".")}`;
}
