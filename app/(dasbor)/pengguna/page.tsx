import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import { Chip, FormFilter, Halaman, JudulUrut } from "@/components/tabel";
import { daftarPengguna } from "@/lib/data/pengguna";
import { cocokCari, param, type ParamUrl, potongHalaman } from "@/lib/tabel";

export const metadata: Metadata = { title: "Pengguna" };

const DASAR = "/pengguna";
const PESAN: Record<string, string> = { ditambah: "Pengguna ditambahkan dan undangan sudah dikirim ke emailnya." };

export default function HalamanPengguna({ searchParams }: PageProps<"/pengguna">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pengguna</h1>
        <Link
          href="/pengguna/baru"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Tambah pengguna
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
        <DaftarPengguna searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DaftarPengguna({ searchParams }: { searchParams: Promise<ParamUrl> }) {
  const sp = await searchParams;
  const semua = await daftarPengguna();

  const cari = param(sp, "q");
  const peran = param(sp, "peran");
  const status = param(sp, "status");
  const urut = param(sp, "urut") === "dibuat" ? "dibuat" : "nama";
  const arah = param(sp, "arah") === "turun" ? -1 : 1;

  const tersaring = semua
    .filter((p) => cocokCari(cari, p.nama, p.email))
    .filter((p) => !peran || p.peran === peran)
    .filter((p) => !status || (status === "aktif") === p.aktif)
    .sort((a, b) => arah * (urut === "dibuat" ? a.dibuatPada.localeCompare(b.dibuatPada) : a.nama.localeCompare(b.nama, "id")));
  const hal = potongHalaman(tersaring, param(sp, "halaman"));
  const pesan = PESAN[param(sp, "pesan")];

  return (
    <>
      {pesan && <PesanStatus pesan={pesan} />}
      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <FormFilter aksi={DASAR}>
          <div className="sm:w-64">
            <KolomIsian label="Cari nama atau email" name="q" type="search" defaultValue={cari} />
          </div>
          <KolomPilihan label="Peran" name="peran" defaultValue={peran}>
            <option value="">Semua</option>
            <option value="admin">Admin</option>
            <option value="tutor">Tutor</option>
          </KolomPilihan>
          <KolomPilihan label="Status" name="status" defaultValue={status}>
            <option value="">Semua</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </KolomPilihan>
        </FormFilter>

        <div className="mt-6 hidden grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 border-b pb-2 text-xs text-muted-foreground md:grid">
          <JudulUrut label="Nama" kolom="nama" dasar={DASAR} sp={sp} />
          <span>Email</span>
          <span>Peran</span>
          <span>Status</span>
          <JudulUrut label="Dibuat" kolom="dibuat" dasar={DASAR} sp={sp} />
        </div>
        {hal.baris.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</p>
        ) : (
          <ul className="divide-y">
            {hal.baris.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pengguna/${p.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 md:grid-cols-[2fr_2fr_1fr_1fr_1fr]"
                >
                  <span className="text-sm font-medium">{p.nama}</span>
                  <span className="col-start-1 row-start-2 truncate text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
                    {p.email}
                  </span>
                  <span className="hidden text-sm md:block">{p.peran === "admin" ? "Admin" : "Tutor"}</span>
                  <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                    <Chip warna={p.aktif ? "hijau" : "merah"}>{p.aktif ? "Aktif" : "Nonaktif"}</Chip>
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {new Date(p.dibuatPada).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Halaman nomor={hal.nomor} total={hal.total} jumlah={hal.jumlah} dasar={DASAR} sp={sp} />
      </section>
    </>
  );
}
