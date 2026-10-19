const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Harga disimpan sebagai bilangan bulat rupiah.
export function formatRupiah(jumlah: number): string {
  return rupiah.format(jumlah);
}
