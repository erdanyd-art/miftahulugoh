"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { PesanStatus } from "@/components/form";
import { Button } from "@/components/ui/button";
import { mulaiUjian, selesaikanUjian, simpanJawaban } from "@/lib/aksi-ujian-peserta";
import { cn } from "@/lib/utils";
import { HURUF_OPSI } from "@/lib/validasi/ujian";

const ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const kelasArab = (t: string) => (ARAB.test(t) ? "text-2xl leading-loose" : "");

export function TombolMulai({ ujianId, durasi }: { ujianId: string; durasi: number }) {
  const [status, kirim, sedang] = useActionState(() => mulaiUjian(ujianId), undefined);
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        if (!window.confirm(`Mulai sekarang? Waktu ${durasi} menit langsung berjalan dan tidak bisa dihentikan.`)) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-3"
    >
      <PesanStatus galat={status?.galat} />
      <Button type="submit" disabled={sedang} className="h-12 w-full rounded-full text-base sm:w-fit sm:px-10">
        {sedang ? "Memulai..." : "Mulai ujian"}
      </Button>
    </form>
  );
}

type Soal = {
  id: string;
  nomor: number;
  jenis: "pilihan_ganda" | "isian";
  pertanyaan: string;
  opsi: string[] | null;
  audio: { judul: string; url: string | null } | null;
};
type Nilai = number | string | null;
type Simpan = "tersimpan" | "menyimpan" | "gagal";

function formatSisa(ms: number) {
  const detik = Math.max(0, Math.ceil(ms / 1000));
  const j = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const d = detik % 60;
  const dua = (n: number) => String(n).padStart(2, "0");
  return j ? `${j}:${dua(m)}:${dua(d)}` : `${dua(m)}:${dua(d)}`;
}

export function Kerjakan({
  percobaanId,
  judul,
  sisaMs,
  soal,
  jawabanAwal,
}: {
  percobaanId: string;
  judul: string;
  sisaMs: number;
  soal: Soal[];
  jawabanAwal: Record<string, Nilai>;
}) {
  const router = useRouter();
  const [jawaban, setJawaban] = useState<Record<string, Nilai>>(jawabanAwal);
  const [simpan, setSimpan] = useState<Record<string, Simpan>>({});
  const [aktif, setAktif] = useState(0);
  const [sisa, setSisa] = useState(sisaMs);
  const [galat, setGalat] = useState<string>();
  const [mengakhiri, setMengakhiri] = useState(false);

  // Antrean simpan per soal: hanya nilai terakhir yang dikirim; satu permintaan per soal pada satu waktu.
  const terbaru = useRef<Record<string, Nilai>>({});
  const berjalan = useRef<Record<string, Promise<void> | undefined>>({});
  const tundaIsian = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const selesai = useRef(false);

  const kirim = useCallback(
    (soalId: string): Promise<void> => {
      if (berjalan.current[soalId]) return berjalan.current[soalId]!;
      const jalan = (async () => {
        while (soalId in terbaru.current) {
          const nilai = terbaru.current[soalId];
          delete terbaru.current[soalId];
          setSimpan((s) => ({ ...s, [soalId]: "menyimpan" }));
          const hasil = await simpanJawaban(percobaanId, soalId, nilai).catch(() => ({ galat: "Koneksi terputus." }));
          if (hasil.galat) {
            setSimpan((s) => ({ ...s, [soalId]: "gagal" }));
            setGalat(
              "habis" in hasil && hasil.habis ? hasil.galat : `Jawaban nomor belum tersimpan: ${hasil.galat} Coba ubah lagi.`,
            );
            if ("habis" in hasil && hasil.habis) router.refresh();
            break;
          }
          setSimpan((s) => ({ ...s, [soalId]: soalId in terbaru.current ? "menyimpan" : "tersimpan" }));
        }
        berjalan.current[soalId] = undefined;
      })();
      berjalan.current[soalId] = jalan;
      return jalan;
    },
    [percobaanId, router],
  );

  const ubah = (soalId: string, nilai: Nilai, segera: boolean) => {
    if (selesai.current) return;
    setJawaban((j) => ({ ...j, [soalId]: nilai }));
    setSimpan((x) => ({ ...x, [soalId]: "menyimpan" })); // termasuk selama jeda ketik isian
    terbaru.current[soalId] = nilai;
    clearTimeout(tundaIsian.current[soalId]);
    if (segera) void kirim(soalId);
    else tundaIsian.current[soalId] = setTimeout(() => void kirim(soalId), 800);
  };

  const kirimSemua = useCallback(async () => {
    for (const t of Object.values(tundaIsian.current)) clearTimeout(t);
    await Promise.all(Object.keys(terbaru.current).map((id) => kirim(id)));
    await Promise.all(Object.values(berjalan.current));
  }, [kirim]);

  const akhiri = useCallback(async () => {
    if (selesai.current) return;
    selesai.current = true;
    setMengakhiri(true);
    await kirimSemua();
    await selesaikanUjian(percobaanId).catch(() => undefined);
    router.refresh();
  }, [kirimSemua, percobaanId, router]);

  // Timer dari sisa waktu SERVER (bukan jam perangkat), dihitung dengan jam monotonik browser.
  useEffect(() => {
    const akhir = performance.now() + sisaMs;
    const id = setInterval(() => {
      const s = akhir - performance.now();
      setSisa(s);
      if (s <= 0) {
        clearInterval(id);
        void akhiri();
      }
    }, 500);
    return () => clearInterval(id);
  }, [sisaMs, akhiri]);

  // Peringatan bila menutup halaman saat masih ada jawaban yang belum terkirim.
  useEffect(() => {
    const cegah = (e: BeforeUnloadEvent) => {
      if (Object.keys(terbaru.current).length || Object.values(berjalan.current).some(Boolean)) e.preventDefault();
    };
    window.addEventListener("beforeunload", cegah);
    return () => window.removeEventListener("beforeunload", cegah);
  }, []);

  const terjawab = (s: Soal) => {
    const v = jawaban[s.id];
    return v !== null && v !== undefined && v !== "";
  };
  const kosong = soal.filter((s) => !terjawab(s)).length;
  const s = soal[aktif];
  const menyimpan = Object.values(simpan).some((x) => x === "menyimpan");
  const gagal = Object.values(simpan).some((x) => x === "gagal");
  const kritis = sisa < 5 * 60 * 1000;

  if (mengakhiri) {
    return <p className="rounded-3xl bg-card p-6 text-center shadow-sm">Menyimpan jawaban dan menyelesaikan ujian...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" dir="auto">
            {judul}
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {gagal ? "Ada jawaban yang belum tersimpan" : menyimpan ? "Menyimpan..." : "Semua jawaban tersimpan"} ·{" "}
            {soal.length - kosong}/{soal.length} terjawab
          </p>
        </div>
        <p
          role="timer"
          aria-label="Sisa waktu"
          className={cn(
            "rounded-full px-4 py-2 font-judul text-lg tabular-nums",
            kritis ? "bg-status-belum text-status-belum-foreground" : "bg-pastel-biru",
          )}
        >
          {formatSisa(sisa)}
        </p>
      </div>

      {galat && <PesanStatus galat={galat} />}

      <nav aria-label="Nomor soal" className="flex flex-wrap gap-2">
        {soal.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setAktif(i)}
            aria-current={i === aktif ? "step" : undefined}
            aria-label={`Soal ${x.nomor}${terjawab(x) ? ", sudah dijawab" : ", belum dijawab"}`}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border text-sm font-semibold",
              terjawab(x) && "border-primary bg-primary text-primary-foreground",
              i === aktif && "ring-2 ring-accent ring-offset-2",
            )}
          >
            {x.nomor}
          </button>
        ))}
      </nav>

      {s && (
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm sm:p-6" aria-labelledby={`judul-${s.id}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 id={`judul-${s.id}`} className="text-lg">
              Soal {s.nomor}
            </h2>
            <span className="text-xs text-muted-foreground">
              {simpan[s.id] === "menyimpan" ? "Menyimpan..." : simpan[s.id] === "gagal" ? "Belum tersimpan" : ""}
            </span>
          </div>
          <p dir="auto" className={cn("text-base whitespace-pre-wrap", kelasArab(s.pertanyaan))}>
            {s.pertanyaan}
          </p>
          {s.audio?.url && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground" dir="auto">
                Audio: {s.audio.judul}
              </span>
              <audio controls preload="metadata" src={s.audio.url} className="w-full">
                <track kind="captions" />
              </audio>
            </div>
          )}

          {s.jenis === "pilihan_ganda" ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Pilihan jawaban soal {s.nomor}</legend>
              {(s.opsi ?? []).map((o, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3",
                    jawaban[s.id] === i && "border-primary bg-pastel-biru",
                  )}
                >
                  <input
                    type="radio"
                    name={`soal-${s.id}`}
                    checked={jawaban[s.id] === i}
                    onChange={() => ubah(s.id, i, true)}
                    className="size-5 shrink-0 accent-primary"
                  />
                  <span className="font-semibold">{HURUF_OPSI[i]}.</span>
                  <span dir="auto" className={cn("flex-1", kelasArab(o))}>
                    {o}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Jawaban Anda
              <textarea
                dir="auto"
                rows={5}
                maxLength={5000}
                value={typeof jawaban[s.id] === "string" ? (jawaban[s.id] as string) : ""}
                onChange={(e) => ubah(s.id, e.target.value, false)}
                onBlur={() => void kirim(s.id)}
                className="rounded-xl border border-input bg-card px-4 py-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring"
              />
            </label>
          )}

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={aktif === 0}
              onClick={() => setAktif((a) => a - 1)}
            >
              Sebelumnya
            </Button>
            {aktif < soal.length - 1 && (
              <Button type="button" className="rounded-full" onClick={() => setAktif((a) => a + 1)}>
                Berikutnya
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-col items-start gap-2 rounded-3xl bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {kosong ? `${kosong} soal belum dijawab.` : "Semua soal sudah dijawab."} Jawaban tersimpan otomatis.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="rounded-full"
          onClick={() => {
            const tanya = kosong
              ? `Masih ada ${kosong} soal belum dijawab. Tetap selesaikan? Jawaban tidak bisa diubah lagi.`
              : "Selesaikan ujian? Jawaban tidak bisa diubah lagi.";
            if (window.confirm(tanya)) void akhiri();
          }}
        >
          Selesai dan kumpulkan
        </Button>
      </div>
    </div>
  );
}
