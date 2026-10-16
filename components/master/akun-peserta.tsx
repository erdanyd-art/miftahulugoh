"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { KolomIsian, PesanStatus } from "@/components/form";
import { useFormAksi } from "@/components/use-form-aksi";
import { Chip } from "@/components/tabel";
import { Button } from "@/components/ui/button";
import { TombolStatusAktif } from "@/components/pengguna/form-pengguna";
import { aturUlangSandiPeserta, buatAkunPeserta, type StatusAkun } from "@/lib/aksi-akun-peserta";

const kelasTombol = "h-11 rounded-full px-6 text-base";

// Ditampilkan sekali setelah akun dibuat / sandi diatur ulang. Tidak bisa dilihat lagi setelah halaman dimuat ulang.
function SandiSekaliLihat({ status }: { status: StatusAkun }) {
  if (!status?.sandiAwal) return null;
  return (
    <div role="status" className="flex flex-col gap-2 rounded-2xl bg-status-menunggu p-4 text-status-menunggu-foreground">
      <p className="text-sm font-semibold">Catat dan berikan ke peserta (hanya tampil sekali):</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt>Username</dt>
        <dd className="font-mono text-base font-semibold">{status.username}</dd>
        <dt>Kata sandi awal</dt>
        <dd className="font-mono text-base font-semibold">{status.sandiAwal}</dd>
      </dl>
      <p className="text-xs">Peserta wajib menggantinya saat pertama kali masuk.</p>
    </div>
  );
}

export function FormBuatAkunPeserta({ pesertaId }: { pesertaId: string }) {
  const { status, onSubmit, sedang } = useFormAksi(buatAkunPeserta.bind(null, pesertaId));
  const router = useRouter();
  if (status?.sandiAwal) {
    return (
      <div className="flex flex-col gap-3">
        <SandiSekaliLihat status={status} />
        <Button type="button" onClick={() => router.refresh()} className={`${kelasTombol} w-fit`}>
          Selesai, sudah saya catat
        </Button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PesanStatus galat={status?.galat} />
      <p className="text-sm text-muted-foreground">
        Peserta belum punya akun. Buat akun agar peserta bisa masuk dan mengerjakan ujian.
      </p>
      <KolomIsian
        label="Username"
        name="username"
        autoCapitalize="none"
        autoComplete="off"
        placeholder="mis. ahmad.fayyadh"
        minLength={3}
        maxLength={30}
        required
      />
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Membuat..." : "Buat akun"}
      </Button>
    </form>
  );
}

export function AkunPeserta({
  pesertaId,
  akun,
}: {
  pesertaId: string;
  akun: { id: string; username: string; aktif: boolean; wajibGantiSandi: boolean };
}) {
  const [status, aksi, sedang] = useActionState(() => aturUlangSandiPeserta(pesertaId), undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Username</span>
        <span className="font-mono font-semibold">{akun.username}</span>
        <Chip warna={akun.aktif ? "hijau" : "merah"}>{akun.aktif ? "Aktif" : "Nonaktif"}</Chip>
        {akun.wajibGantiSandi && <Chip warna="kuning">Belum ganti sandi awal</Chip>}
      </div>
      <form
        action={aksi}
        onSubmit={(e) => {
          if (!window.confirm("Atur ulang kata sandi? Kata sandi lama peserta langsung tidak berlaku.")) e.preventDefault();
        }}
        className="flex flex-col gap-3"
      >
        {status?.sandiAwal ? <SandiSekaliLihat status={status} /> : <PesanStatus galat={status?.galat} />}
        <Button type="submit" variant="outline" disabled={sedang} className={`${kelasTombol} w-fit`}>
          {sedang ? "Memproses..." : "Atur ulang kata sandi"}
        </Button>
      </form>
      <TombolStatusAktif id={akun.id} aktif={akun.aktif} nama={akun.username} />
    </div>
  );
}
