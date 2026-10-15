"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import {
  kirimTautanSandi,
  simpanPengaturan,
  tambahPengguna,
  type StatusAksi,
  ubahStatusAktif,
} from "@/lib/aksi-pengguna";
import type { Peran } from "@/lib/nav";
import { ZONA_WAKTU } from "@/lib/validasi/pengguna";

const kelasTombol = "h-11 rounded-full px-6 text-base";

function PilihanPeran({ awal }: { awal?: Peran }) {
  return (
    <KolomPilihan label="Peran" name="peran" defaultValue={awal ?? "tutor"} required>
      <option value="tutor">Tutor</option>
      <option value="admin">Admin</option>
    </KolomPilihan>
  );
}

export function FormTambahPengguna() {
  const [status, aksi, sedang] = useActionState(tambahPengguna, undefined);
  return (
    <form action={aksi} className="flex max-w-lg flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Nama" name="nama" required maxLength={100} autoComplete="off" />
      <KolomIsian label="Email" name="email" type="email" required autoComplete="off" />
      <PilihanPeran />
      <p className="text-sm text-muted-foreground">
        Pengguna menerima email undangan untuk membuat kata sandi sendiri.
      </p>
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Mengirim undangan..." : "Tambah dan kirim undangan"}
      </Button>
    </form>
  );
}

export function FormUbahPengguna({
  aksiUbah,
  nama,
  peran,
  diriSendiri,
}: {
  aksiUbah: (s: StatusAksi, f: FormData) => Promise<StatusAksi>;
  nama: string;
  peran: Peran;
  diriSendiri: boolean;
}) {
  const [status, aksi, sedang] = useActionState(aksiUbah, undefined);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Nama" name="nama" defaultValue={nama} required maxLength={100} />
      {diriSendiri ? (
        <>
          <input type="hidden" name="peran" value={peran} />
          <p className="text-sm text-muted-foreground">Peran akun Anda sendiri tidak bisa diubah di sini.</p>
        </>
      ) : (
        <PilihanPeran awal={peran} />
      )}
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function TombolStatusAktif({ id, aktif, nama }: { id: string; aktif: boolean; nama: string }) {
  const [status, aksi, sedang] = useActionState(() => ubahStatusAktif(id, !aktif), undefined);
  return (
    <form
      action={aksi}
      onSubmit={(e) => {
        const tanya = aktif
          ? `Nonaktifkan ${nama}? Pengguna langsung tidak bisa mengakses dashboard.`
          : `Aktifkan kembali ${nama}?`;
        if (!window.confirm(tanya)) e.preventDefault();
      }}
      className="flex flex-col gap-3"
    >
      <PesanStatus {...status} />
      <Button
        type="submit"
        variant={aktif ? "destructive" : "default"}
        disabled={sedang}
        className={`${kelasTombol} w-fit`}
      >
        {sedang ? "Memproses..." : aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
      </Button>
    </form>
  );
}

export function TombolKirimTautan({ id }: { id: string }) {
  const [status, aksi, sedang] = useActionState(() => kirimTautanSandi(id), undefined);
  return (
    <form action={aksi} className="flex flex-col gap-3">
      <PesanStatus {...status} />
      <Button type="submit" variant="outline" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Mengirim..." : "Kirim tautan buat kata sandi"}
      </Button>
    </form>
  );
}

export function FormPengaturan({ namaLembaga, zonaWaktu }: { namaLembaga: string; zonaWaktu: string }) {
  const [status, aksi, sedang] = useActionState(simpanPengaturan, undefined);
  const dikenal = ZONA_WAKTU.some((z) => z.nilai === zonaWaktu);
  return (
    <form action={aksi} className="flex max-w-lg flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Nama lembaga" name="namaLembaga" defaultValue={namaLembaga} required maxLength={150} />
      <KolomPilihan label="Zona waktu lembaga" name="zonaWaktu" defaultValue={zonaWaktu} required>
        {!dikenal && <option value={zonaWaktu}>{zonaWaktu}</option>}
        {ZONA_WAKTU.map((z) => (
          <option key={z.nilai} value={z.nilai}>
            {z.label}
          </option>
        ))}
      </KolomPilihan>
      <p className="text-sm text-muted-foreground">
        Zona waktu menentukan “hari ini” dan jam mulai absen tutor. Pastikan sesuai lokasi lembaga.
      </p>
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Menyimpan..." : "Simpan pengaturan"}
      </Button>
    </form>
  );
}
