import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { KolomIsian, KolomPilihan } from "@/components/form";
import { Kartu, KepalaHalaman, Memuat } from "@/components/halaman";
import { Chip, FormFilter, Halaman } from "@/components/tabel";
import { daftarPerubahan, type Json, NAMA_AKSI, NAMA_TABEL } from "@/lib/audit";
import { daftarAudit, PER_HALAMAN_AUDIT } from "@/lib/data/audit";
import { param, type ParamUrl } from "@/lib/tabel";

export const metadata: Metadata = { title: "Audit" };

export default function HalamanAudit({ searchParams }: PageProps<"/audit">) {
  return (
    <div className="flex flex-col gap-6">
      <KepalaHalaman judul="Log audit" />
      <Suspense fallback={<Memuat />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const tanggalValid = (t: string) => z.iso.date().safeParse(t).success;

async function Isi({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const tabel = Object.hasOwn(NAMA_TABEL, param(sp, "tabel")) ? param(sp, "tabel") : "";
  const penggunaId = z.guid().safeParse(param(sp, "pengguna")).success ? param(sp, "pengguna") : "";
  const dari = tanggalValid(param(sp, "dari")) ? param(sp, "dari") : "";
  const sampai = tanggalValid(param(sp, "sampai")) ? param(sp, "sampai") : "";
  const halaman = Math.max(1, Number.parseInt(param(sp, "halaman"), 10) || 1);

  const hasil = await daftarAudit({ tabel, penggunaId, dari, sampai, halaman });
  const namaPengguna = new Map(hasil.pengguna.map((p) => [p.id, p.nama]));
  const totalHalaman = Math.max(1, Math.ceil(hasil.jumlah / PER_HALAMAN_AUDIT));
  const formatWaktu = new Intl.DateTimeFormat("id-ID", { timeZone: hasil.zona, dateStyle: "medium", timeStyle: "short" });

  return (
    <Kartu>
      <FormFilter aksi="/audit">
        <KolomPilihan label="Data" name="tabel" defaultValue={tabel}>
          <option value="">Semua</option>
          {Object.entries(NAMA_TABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Pelaku" name="pengguna" defaultValue={penggunaId}>
          <option value="">Semua</option>
          {hasil.pengguna.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomIsian label="Dari tanggal" name="dari" type="date" defaultValue={dari} />
        <KolomIsian label="Sampai tanggal" name="sampai" type="date" defaultValue={sampai} />
      </FormFilter>

      {hasil.baris.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Tidak ada catatan audit yang cocok.</p>
      ) : (
        <ul className="mt-6 divide-y">
          {hasil.baris.map((b) => {
            const perubahan = daftarPerubahan(b.aksi, b.sebelum as Json, b.sesudah as Json);
            return (
              <li key={b.id} className="flex flex-col gap-2 py-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Chip warna={b.aksi === "DELETE" ? "merah" : b.aksi === "INSERT" ? "hijau" : "kuning"}>
                    {NAMA_AKSI[b.aksi] ?? b.aksi}
                  </Chip>
                  <span className="font-medium">{NAMA_TABEL[b.tabel] ?? b.tabel}</span>
                  <span className="text-muted-foreground">
                    oleh {b.pengguna_id ? (namaPengguna.get(b.pengguna_id) ?? "pengguna tidak dikenal") : "sistem / SQL langsung"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{formatWaktu.format(new Date(b.waktu))}</span>
                </div>
                {perubahan.length > 0 && (
                  <details className="rounded-xl bg-secondary/50 px-4 py-2 text-sm">
                    <summary className="cursor-pointer text-xs font-medium">
                      {perubahan.length} kolom {b.aksi === "UPDATE" ? "berubah" : "tercatat"}
                    </summary>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                      {perubahan.map((p) => (
                        <div key={p.kolom} className="contents">
                          <dt className="font-mono text-xs text-muted-foreground">{p.kolom}</dt>
                          <dd className="break-words">
                            {b.aksi === "UPDATE" ? (
                              <>
                                <span className="text-status-belum-foreground line-through">{p.sebelum}</span> →{" "}
                                <span className="text-status-lunas-foreground">{p.sesudah}</span>
                              </>
                            ) : (
                              p.sesudah || p.sebelum
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Halaman nomor={Math.min(halaman, totalHalaman)} total={totalHalaman} jumlah={hasil.jumlah} dasar="/audit" sp={sp} />
    </Kartu>
  );
}
