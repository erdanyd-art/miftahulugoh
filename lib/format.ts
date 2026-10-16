const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Uang disimpan sebagai bilangan bulat rupiah.
export function formatRupiah(jumlah: number): string {
  return rupiah.format(jumlah);
}

const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"] as const;

// Hari ISO seperti di database: 1 = Senin ... 7 = Ahad.
export function namaHari(hari: number): string {
  const nama = NAMA_HARI[hari - 1];
  if (!Number.isInteger(hari) || nama === undefined) {
    throw new RangeError(`hari harus 1..7, didapat ${hari}`);
  }
  return nama;
}

// Jam dari database ("08:00:00") ditampilkan gaya Indonesia ("08.00").
export function formatJam(jam: string): string {
  return jam.slice(0, 5).replace(":", ".");
}

export const DAFTAR_HARI = [1, 2, 3, 4, 5, 6, 7] as const;

export function formatUkuran(byte: number): string {
  if (byte < 1024 * 1024) return `${Math.max(1, Math.round(byte / 1024))} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
