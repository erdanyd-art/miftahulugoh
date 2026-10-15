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
