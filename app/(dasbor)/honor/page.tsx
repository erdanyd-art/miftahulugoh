import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TabelSesi, TotalHonor } from "@/components/absensi/tabel-sesi";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { FormFilter } from "@/components/tabel";
import { wajibPeran } from "@/lib/auth";
import { daftarSesi, saldoHonor, waktuLembaga } from "@/lib/data/absensi";
import { formatRupiah } from "@/lib/format";
import { param, type ParamUrl, urlDengan } from "@/lib/tabel";
import { bulanValid, namaBulan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Honor" };

export default function HalamanHonor({ searchParams }: PageProps<"/honor">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Honor" />
      <Suspense fallback={<Memuat />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  await wajibPeran("admin");
  const sp = await searchParams;
  const waktu = await waktuLembaga();
  const bulan = bulanValid(param(sp, "bulan")) ? param(sp, "bulan") : waktu.bulan;
  const tutor = param(sp, "tutor");
  const [saldo, semua] = await Promise.all([saldoHonor(), daftarSesi(bulan)]);
  const sesi = semua.filter((s) => !tutor || s.tutor?.id === tutor);

  return (
    <>
      <Kartu judul="Saldo honor per tutor">
        <p className="-mt-2 mb-4 text-xs text-muted-foreground">
          Saldo = honor sesi terkumpul dikurangi pembayaran honor yang dicatat di kas (kategori Honor Tutor).
        </p>
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
          <span>Tutor</span>
          <span>Terkumpul</span>
          <span>Dibayar</span>
          <span>Saldo</span>
        </div>
        {saldo.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Belum ada tutor.</p>
        ) : (
          <ul className="divide-y">
            {saldo.map((s) => (
              <li key={s.tutor_id}>
                <Link
                  href={urlDengan("/honor", sp, { tutor: s.tutor_id })}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[2fr_1fr_1fr_1fr]"
                >
                  <span className="text-sm font-medium">{s.nama}</span>
                  <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm md:text-foreground">
                    <span className="md:hidden">Terkumpul </span>
                    {formatRupiah(s.honor_terkumpul)}
                    <span className="md:hidden"> · dibayar {formatRupiah(s.honor_dibayar)}</span>
                  </span>
                  <span data-kolom="dibayar" className="hidden text-sm md:block">{formatRupiah(s.honor_dibayar)}</span>
                  <span className="col-start-2 row-span-2 row-start-1 font-judul md:col-start-auto md:row-span-1 md:row-start-auto">
                    {formatRupiah(s.saldo)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kartu>

      <Kartu judul={`Riwayat sesi ${namaBulan(bulan)}`}>
        <FormFilter aksi="/honor">
          <KolomIsian label="Bulan" name="bulan" type="month" defaultValue={bulan} />
          <KolomPilihan label="Tutor" name="tutor" defaultValue={tutor}>
            <option value="">Semua</option>
            {saldo.map((s) => (
              <option key={s.tutor_id} value={s.tutor_id}>
                {s.nama}
              </option>
            ))}
          </KolomPilihan>
        </FormFilter>
        <TabelSesi sesi={sesi} tampilkanTutor />
        <TotalHonor sesi={sesi} />
      </Kartu>
    </>
  );
}
