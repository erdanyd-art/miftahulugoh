import type { Metadata } from "next";
import { Suspense } from "react";
import { KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { GrafikBulanan } from "@/components/keuangan/grafik-bulanan";
import { TabKeuangan } from "@/components/keuangan/tab-keuangan";
import { FormFilter } from "@/components/tabel";
import { waktuLembaga } from "@/lib/data/absensi";
import { rekapBulanan } from "@/lib/data/keuangan";
import { formatRupiah } from "@/lib/format";
import { param, type ParamUrl } from "@/lib/tabel";
import { namaBulan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Rekap keuangan" };

export default function HalamanRekap({ searchParams }: PageProps<"/keuangan/rekap">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Keuangan" />
      <TabKeuangan />
      <Suspense fallback={<Memuat />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const waktu = await waktuLembaga();
  const tahunIni = Number(waktu.bulan.slice(0, 4));
  const diminta = Number(param(sp, "tahun"));
  const tahun = Number.isInteger(diminta) && diminta >= 2020 && diminta <= tahunIni ? diminta : tahunIni;
  const bulanList = Array.from({ length: 12 }, (_, i) => `${tahun}-${String(i + 1).padStart(2, "0")}`).filter(
    (b) => b <= waktu.bulan,
  );
  const rekap = await rekapBulanan(bulanList);
  const total = rekap.reduce(
    (t, r) => ({
      pemasukan: t.pemasukan + r.pemasukan,
      pengeluaran: t.pengeluaran + r.pengeluaran,
      bayarLunas: t.bayarLunas + r.bayarLunas,
      bayarBelum: t.bayarBelum + r.bayarBelum,
      honorTutorSesi: t.honorTutorSesi + r.honorTutorSesi,
      honorTutorDibayar: t.honorTutorDibayar + r.honorTutorDibayar,
      honorPegawai: t.honorPegawai + r.honorPegawai,
    }),
    { pemasukan: 0, pengeluaran: 0, bayarLunas: 0, bayarBelum: 0, honorTutorSesi: 0, honorTutorDibayar: 0, honorPegawai: 0 },
  );
  const tahunPilihan = Array.from({ length: Math.max(1, tahunIni - 2025) }, (_, i) => tahunIni - i);

  const sel = "px-3 py-2 text-right tabular-nums whitespace-nowrap";
  return (
    <>
      <Kartu>
        <FormFilter aksi="/keuangan/rekap">
          <KolomPilihan label="Tahun" name="tahun" defaultValue={String(tahun)}>
            {tahunPilihan.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </KolomPilihan>
        </FormFilter>
        <p className="mt-4 text-xs text-muted-foreground">
          Kas, pembayaran peserta, dan honor ditampilkan terpisah dan tidak dijumlahkan (pembayaran peserta tidak otomatis masuk kas).
        </p>
      </Kartu>

      <Kartu judul={`Kas ${tahun}: pemasukan dan pengeluaran per bulan`}>
        <GrafikBulanan data={rekap} />
      </Kartu>

      <Kartu judul={`Tabel rekap ${tahun}`}>
        <div className="mb-4 flex justify-end">
          <a href={`/ekspor/honor?tahun=${tahun}`} className="text-sm font-medium text-accent hover:underline">
            Ekspor CSV rekap {tahun}
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <caption className="sr-only">Rekap bulanan kas, pembayaran peserta, dan honor tahun {tahun}</caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-normal">Bulan</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Kas masuk</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Kas keluar</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Selisih kas</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Bayar lunas</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Belum lunas</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Honor tutor (sesi)</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Honor tutor dibayar</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Honor pegawai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rekap.map((r) => (
                <tr key={r.bulan}>
                  <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">{namaBulan(r.bulan)}</th>
                  <td className={sel}>{formatRupiah(r.pemasukan)}</td>
                  <td className={sel}>{formatRupiah(r.pengeluaran)}</td>
                  <td className={sel}>{formatRupiah(r.pemasukan - r.pengeluaran)}</td>
                  <td className={sel}>{formatRupiah(r.bayarLunas)}</td>
                  <td className={sel}>{formatRupiah(r.bayarBelum)}</td>
                  <td className={sel}>{formatRupiah(r.honorTutorSesi)}</td>
                  <td className={sel}>{formatRupiah(r.honorTutorDibayar)}</td>
                  <td className={sel}>{formatRupiah(r.honorPegawai)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <th scope="row" className="px-3 py-2 text-left">Total</th>
                <td className={sel}>{formatRupiah(total.pemasukan)}</td>
                <td className={sel}>{formatRupiah(total.pengeluaran)}</td>
                <td className={sel}>{formatRupiah(total.pemasukan - total.pengeluaran)}</td>
                <td className={sel}>{formatRupiah(total.bayarLunas)}</td>
                <td className={sel}>{formatRupiah(total.bayarBelum)}</td>
                <td className={sel}>{formatRupiah(total.honorTutorSesi)}</td>
                <td className={sel}>{formatRupiah(total.honorTutorDibayar)}</td>
                <td className={sel}>{formatRupiah(total.honorPegawai)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Kartu>
    </>
  );
}
