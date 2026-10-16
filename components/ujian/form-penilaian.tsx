"use client";

import { useActionState } from "react";
import { PesanStatus } from "@/components/form";
import { useFormAksi } from "@/components/use-form-aksi";
import { Button } from "@/components/ui/button";
import { nilaiIsian, umumkanNilai } from "@/lib/aksi-penilaian";

export function FormSkorIsian({
  jawabanId,
  bobot,
  skor,
  peserta,
}: {
  jawabanId: string;
  bobot: number;
  skor: number | null;
  peserta: string;
}) {
  const { status, onSubmit, sedang } = useFormAksi(nilaiIsian.bind(null, jawabanId));
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium">
        Skor (0–{bobot})
        <input
          name="skor"
          type="number"
          inputMode="numeric"
          min={0}
          max={bobot}
          step={1}
          defaultValue={skor ?? ""}
          aria-label={`Skor ${peserta} (0 sampai ${bobot})`}
          className="h-10 w-24 rounded-xl border border-input bg-card px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring"
        />
      </label>
      <Button type="submit" disabled={sedang} className="h-10 rounded-full px-4">
        {sedang ? "..." : "Simpan"}
      </Button>
      {status && (
        <span className="w-full sm:w-auto">
          <PesanStatus {...status} />
        </span>
      )}
    </form>
  );
}

export function TombolUmumkan({ ujianId, diumumkan }: { ujianId: string; diumumkan: boolean }) {
  const [status, kirim, sedang] = useActionState(() => umumkanNilai(ujianId, !diumumkan), undefined);
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        const tanya = diumumkan
          ? "Batalkan pengumuman? Peserta tidak lagi melihat nilainya."
          : "Umumkan nilai? Peserta langsung bisa melihat nilainya sendiri.";
        if (!window.confirm(tanya)) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <PesanStatus {...status} />
      <Button type="submit" variant={diumumkan ? "outline" : "default"} disabled={sedang} className="w-fit rounded-full">
        {sedang ? "Memproses..." : diumumkan ? "Batalkan pengumuman" : "Umumkan nilai"}
      </Button>
    </form>
  );
}
