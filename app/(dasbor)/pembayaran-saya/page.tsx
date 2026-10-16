import type { Metadata } from "next";
import { Suspense } from "react";
import { Kartu, Memuat } from "@/components/halaman";
import { Chip } from "@/components/tabel";
import { pembayaranSaya } from "@/lib/data/portal-peserta";
import { formatRupiah } from "@/lib/format";
import { formatTanggal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Pembayaran saya" };

export default function HalamanPembayaranSaya() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Pembayaran Saya</h1>
      <Suspense fallback={<Memuat />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  const data = await pembayaranSaya();
  const belum = data.filter((p) => p.status === "belum_lunas");
  return (
    <Kartu>
      {belum.length > 0 && (
        <p className="mb-4 rounded-xl bg-status-belum px-4 py-3 text-sm text-status-belum-foreground">
          {belum.length} pembayaran belum lunas: {formatRupiah(belum.reduce((n, p) => n + p.jumlah, 0))}.
        </p>
      )}
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada catatan pembayaran.</p>
      ) : (
        <ul className="divide-y">
          {data.map((p) => (
            <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3">
              <span className="text-sm font-medium" dir="auto">
                {p.keterangan}
              </span>
              <span className="text-sm font-semibold">{formatRupiah(p.jumlah)}</span>
              <span className="text-xs text-muted-foreground">{formatTanggal(p.tanggal)}</span>
              <span className="justify-self-end">
                <Chip warna={p.status === "lunas" ? "hijau" : "merah"}>{p.status === "lunas" ? "Lunas" : "Belum Lunas"}</Chip>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Ada yang tidak sesuai? Hubungi admin lembaga.</p>
    </Kartu>
  );
}
