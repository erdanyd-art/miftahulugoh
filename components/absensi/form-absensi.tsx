"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { KolomIsian, PesanStatus } from "@/components/form";
import { useFormAksi } from "@/components/use-form-aksi";
import { kunciSesi, type StatusAksi } from "@/lib/aksi-absensi";
import { cn } from "@/lib/utils";

type Aksi = (s: StatusAksi, f: FormData) => Promise<StatusAksi>;

export function FormAbsen({
  aksi,
  tanggal,
  peserta,
  hadirAwal,
  terkunci,
}: {
  aksi: Aksi;
  tanggal: string;
  peserta: { id: string; nama: string }[];
  hadirAwal: string[];
  terkunci: boolean;
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  const [hadir, setHadir] = useState(() => new Set(hadirAwal));
  const ubah = (id: string, centang: boolean) =>
    setHadir((lama) => {
      const baru = new Set(lama);
      if (centang) baru.add(id);
      else baru.delete(id);
      return baru;
    });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <input type="hidden" name="tanggal" value={tanggal} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" aria-live="polite">
          Hadir {hadir.size} dari {peserta.length}
        </p>
        {!terkunci && peserta.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHadir(new Set(peserta.map((p) => p.id)))}
              className="rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Semua hadir
            </button>
            <button type="button" onClick={() => setHadir(new Set())} className="rounded-full border px-3 py-1.5 text-xs font-medium">
              Kosongkan
            </button>
          </div>
        )}
      </div>

      {peserta.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Kelas ini belum punya peserta aktif. Sesi tetap bisa disimpan (honor setengah).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {peserta.map((p) => {
            const dicentang = hadir.has(p.id);
            return (
              <li key={p.id}>
                <label
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-base transition-colors",
                    dicentang ? "border-status-lunas-foreground/30 bg-status-lunas" : "bg-card",
                    terkunci && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    name="hadir"
                    value={p.id}
                    checked={dicentang}
                    disabled={terkunci}
                    onChange={(e) => ubah(p.id, e.target.checked)}
                    className="size-5 accent-primary"
                  />
                  <span className="flex-1">{p.nama}</span>
                  <span className={cn("text-xs font-medium", dicentang ? "text-status-lunas-foreground" : "text-muted-foreground")}>
                    {dicentang ? "Hadir" : "Tidak hadir"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {terkunci ? (
        <p className="text-sm text-muted-foreground">Sesi ini dikunci admin dan tidak bisa diubah.</p>
      ) : (
        <Button type="submit" disabled={sedang} className="h-12 w-full rounded-full text-base sm:w-fit sm:px-8">
          {sedang ? "Menyimpan..." : "Simpan absensi"}
        </Button>
      )}
    </form>
  );
}

export function FormKoreksiHonor({ aksi, honor }: { aksi: Aksi; honor: number }) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <PesanStatus {...status} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <KolomIsian label="Honor sesi (Rp)" name="honor" type="number" min={0} step={1} defaultValue={honor} required />
        </div>
        <Button type="submit" variant="outline" disabled={sedang} className="h-11 w-fit rounded-full px-5">
          {sedang ? "Menyimpan..." : "Koreksi honor"}
        </Button>
      </div>
    </form>
  );
}

export function TombolKunci({ sesiId, dikunci }: { sesiId: string; dikunci: boolean }) {
  const [status, kirim, sedang] = useActionState(() => kunciSesi(sesiId, !dikunci), undefined);
  return (
    <form action={kirim} className="flex flex-col gap-3">
      <PesanStatus {...status} />
      <Button type="submit" variant={dikunci ? "outline" : "default"} disabled={sedang} className="h-11 w-fit rounded-full px-5">
        {sedang ? "Memproses..." : dikunci ? "Buka kunci sesi" : "Kunci sesi"}
      </Button>
    </form>
  );
}
