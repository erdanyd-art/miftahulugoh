import type { Metadata } from "next";
import { Suspense } from "react";
import { KartuSaldo } from "@/components/absensi/kartu-saldo";
import { TabelSesi, TotalHonor } from "@/components/absensi/tabel-sesi";
import { KolomIsian } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { FormFilter } from "@/components/tabel";
import { wajibPeran } from "@/lib/auth";
import { daftarSesi, saldoHonor, waktuLembaga } from "@/lib/data/absensi";
import { param, type ParamUrl } from "@/lib/tabel";
import { bulanValid, namaBulan } from "@/lib/waktu";

export const metadata: Metadata = { title: "Honor Saya" };

export default function HalamanHonorSaya({ searchParams }: PageProps<"/honor-saya">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Honor Saya" />
      <Suspense fallback={<Memuat />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const saya = await wajibPeran("tutor");
  const sp = await searchParams;
  const waktu = await waktuLembaga();
  const bulan = bulanValid(param(sp, "bulan")) ? param(sp, "bulan") : waktu.bulan;
  const [saldo, sesi] = await Promise.all([saldoHonor(), daftarSesi(bulan)]);
  const milik = saldo.find((s) => s.tutor_id === saya.id);

  return (
    <>
      <KartuSaldo terkumpul={milik?.honor_terkumpul ?? 0} dibayar={milik?.honor_dibayar ?? 0} saldo={milik?.saldo ?? 0} />
      <Kartu judul={`Riwayat honor ${namaBulan(bulan)}`}>
        <FormFilter aksi="/honor-saya">
          <KolomIsian label="Bulan" name="bulan" type="month" defaultValue={bulan} />
        </FormFilter>
        <TabelSesi sesi={sesi} tampilkanTutor={false} />
        <TotalHonor sesi={sesi} />
      </Kartu>
    </>
  );
}
