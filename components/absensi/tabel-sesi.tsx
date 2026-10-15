import Link from "next/link";
import { Chip } from "@/components/tabel";
import type { daftarSesi } from "@/lib/data/absensi";
import { formatRupiah } from "@/lib/format";
import { formatTanggal } from "@/lib/waktu";

type Sesi = Awaited<ReturnType<typeof daftarSesi>>[number];

export function TabelSesi({ sesi, tampilkanTutor }: { sesi: Sesi[]; tampilkanTutor: boolean }) {
  const kolom = tampilkanTutor ? "md:grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr]" : "md:grid-cols-[1fr_2fr_1fr_1fr_1fr]";
  return (
    <>
      <div className={`mt-6 hidden gap-4 border-b pb-2 text-xs text-muted-foreground md:grid ${kolom}`}>
        <span>Tanggal</span>
        <span>Kelas</span>
        {tampilkanTutor && <span>Tutor</span>}
        <span>Hadir</span>
        <span>Honor</span>
        <span>Status</span>
      </div>
      {sesi.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Belum ada sesi pada periode ini.</p>
      ) : (
        <ul className="divide-y">
          {sesi.map((s) => (
            <li key={s.id}>
              <Link
                href={`/absensi/sesi/${s.id}`}
                className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-secondary/50 ${kolom}`}
              >
                <span className="text-sm font-medium md:font-normal">
                  {formatTanggal(s.tanggal)}
                  <span className="md:hidden"> · {s.kelas?.nama}</span>
                </span>
                <span className="hidden text-sm font-medium md:block">{s.kelas?.nama}</span>
                {tampilkanTutor && <span className="hidden text-sm md:block">{s.tutor?.nama}</span>}
                <span className="col-start-1 row-start-2 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm md:text-foreground">
                  {s.hadir}/{s.total}
                  <span className="md:hidden">
                    {" "}
                    hadir · {formatRupiah(s.honor)}
                    {tampilkanTutor && s.tutor ? ` · ${s.tutor.nama}` : ""}
                  </span>
                </span>
                <span className="hidden text-sm md:block">{formatRupiah(s.honor)}</span>
                <span className="col-start-2 row-span-2 row-start-1 flex flex-wrap gap-1 md:col-start-auto md:row-span-1 md:row-start-auto">
                  {s.dikunci && <Chip warna="netral">Terkunci</Chip>}
                  {s.honor_dikoreksi && <Chip warna="kuning">Dikoreksi</Chip>}
                  {!s.dikunci && !s.honor_dikoreksi && <Chip warna="hijau">Tercatat</Chip>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function TotalHonor({ sesi }: { sesi: Sesi[] }) {
  const total = sesi.reduce((n, s) => n + s.honor, 0);
  return (
    <p className="mt-4 flex justify-between border-t pt-4 text-sm">
      <span className="text-muted-foreground">{sesi.length} sesi</span>
      <span>
        Total honor <span className="font-judul text-lg">{formatRupiah(total)}</span>
      </span>
    </p>
  );
}
