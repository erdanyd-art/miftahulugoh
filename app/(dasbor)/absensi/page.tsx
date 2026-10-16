import type { Metadata } from "next";
import { Suspense } from "react";
import { DaftarJadwalHariIni } from "@/components/absensi/jadwal-hari-ini";
import { TabelSesi } from "@/components/absensi/tabel-sesi";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { FormFilter } from "@/components/tabel";
import { penggunaStaf } from "@/lib/auth";
import { daftarSesi, jadwalHariIni } from "@/lib/data/absensi";
import { param, type ParamUrl } from "@/lib/tabel";
import { bulanValid } from "@/lib/waktu";

export const metadata: Metadata = { title: "Absensi" };

export default function HalamanAbsensi({ searchParams }: PageProps<"/absensi">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Absensi" />
      <Suspense fallback={<Memuat />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const pengguna = await penggunaStaf();
  const admin = pengguna.peran === "admin";
  const sp = await searchParams;
  const { jadwal, waktu } = await jadwalHariIni();

  const bulan = bulanValid(param(sp, "bulan")) ? param(sp, "bulan") : waktu.bulan;
  const kelas = param(sp, "kelas");
  const tutor = param(sp, "tutor");
  const semua = await daftarSesi(bulan);
  const pilihanKelas = [...new Map(semua.flatMap((s) => (s.kelas ? [s.kelas] : [])).map((k) => [k.id, k])).values()];
  const pilihanTutor = [...new Map(semua.flatMap((s) => (s.tutor ? [s.tutor] : [])).map((t) => [t.id, t])).values()];
  const sesi = semua.filter((s) => (!kelas || s.kelas?.id === kelas) && (!tutor || s.tutor?.id === tutor));

  return (
    <>
      <Kartu judul={admin ? "Absensi tutor hari ini" : "Jadwal hari ini"}>
        <DaftarJadwalHariIni jadwal={jadwal} waktu={waktu} tampilkanTutor={admin} />
      </Kartu>
      <Kartu judul="Riwayat sesi">
        <FormFilter aksi="/absensi">
          <KolomIsian label="Bulan" name="bulan" type="month" defaultValue={bulan} />
          <KolomPilihan label="Kelas" name="kelas" defaultValue={kelas}>
            <option value="">Semua</option>
            {pilihanKelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </KolomPilihan>
          {admin && (
            <KolomPilihan label="Tutor" name="tutor" defaultValue={tutor}>
              <option value="">Semua</option>
              {pilihanTutor.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </KolomPilihan>
          )}
        </FormFilter>
        <TabelSesi sesi={sesi} tampilkanTutor={admin} />
      </Kartu>
    </>
  );
}
