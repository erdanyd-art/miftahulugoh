import { formatRupiah } from "@/lib/format";
import { namaBulan } from "@/lib/waktu";

type Titik = { bulan: string; pemasukan: number; pengeluaran: number };

const SERI = [
  { kunci: "pemasukan", label: "Pemasukan", warna: "bg-chart-pemasukan" },
  { kunci: "pengeluaran", label: "Pengeluaran", warna: "bg-chart-pengeluaran" },
] as const;

// Grafik batang berkelompok tanpa pustaka: satu sumbu, batang <= 24px, ujung data membulat 4px,
// celah 2px antar batang, legenda selalu ada, label nilai hanya untuk bulan terakhir, tooltip saat hover/fokus.
export function GrafikBulanan({ data }: { data: Titik[] }) {
  const maks = Math.max(1, ...data.flatMap((d) => [d.pemasukan, d.pengeluaran]));
  const kosong = data.every((d) => d.pemasukan === 0 && d.pengeluaran === 0);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {SERI.map((s) => (
          <span key={s.kunci} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-3 rounded-sm ${s.warna}`} />
            <span className="text-foreground">{s.label}</span>
          </span>
        ))}
        <span className="ml-auto">Skala tertinggi {formatRupiah(maks)}</span>
      </figcaption>
      {kosong ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data kas pada periode ini.</p>
      ) : (
        <div className="flex h-52 items-end gap-2 border-b border-border pt-6 sm:gap-4" role="list" aria-label="Pemasukan dan pengeluaran per bulan">
          {data.map((d, i) => {
            const terakhir = i === data.length - 1;
            return (
              <div key={d.bulan} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end">
                <div className="flex h-full items-end gap-0.5">
                  {SERI.map((s) => {
                    const nilai = d[s.kunci];
                    const tinggi = nilai === 0 ? 0 : Math.max(2, (nilai / maks) * 100);
                    return (
                      <div key={s.kunci} className="group relative flex h-full w-3 items-end sm:w-5" tabIndex={0}>
                        {terakhir && nilai > 0 && (
                          <span
                            className="absolute left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-muted-foreground"
                            style={{ bottom: `calc(${tinggi}% + 4px)` }}
                          >
                            {Math.round(nilai / 1000)}rb
                          </span>
                        )}
                        <div className={`w-full rounded-t-[4px] ${s.warna}`} style={{ height: `${tinggi}%` }} />
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-primary px-2 py-1 text-xs whitespace-nowrap text-primary-foreground group-hover:block group-focus:block"
                        >
                          {namaBulan(d.bulan)} · {s.label} {formatRupiah(nilai)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!kosong && (
        <div className="flex gap-2 sm:gap-4">
          {data.map((d) => (
            <span key={d.bulan} className="flex-1 text-center text-xs text-muted-foreground">
              {namaBulan(d.bulan).slice(0, 3)}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
