"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { aturSandi, lupaSandi, masuk } from "@/lib/aksi-auth";
import { PANJANG_SANDI_MIN } from "@/lib/validasi/auth";
import { KolomIsian, PesanStatus } from "./bingkai-auth";

const kelasTombol = "h-11 w-full rounded-full text-base";

export function FormMasuk() {
  const [status, aksi, sedang] = useActionState(masuk, undefined);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <PesanStatus galat={status?.galat} />
      <KolomIsian label="Email" name="email" type="email" autoComplete="email" defaultValue={status?.email} required />
      <KolomIsian label="Kata sandi" name="kataSandi" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Memproses..." : "Masuk"}
      </Button>
      <Link href="/lupa-sandi" className="text-center text-sm font-medium text-accent hover:underline">
        Lupa kata sandi?
      </Link>
    </form>
  );
}

export function FormLupaSandi() {
  const [status, aksi, sedang] = useActionState(lupaSandi, undefined);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Email" name="email" type="email" autoComplete="email" required />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Mengirim..." : "Kirim tautan"}
      </Button>
      <Link href="/masuk" className="text-center text-sm font-medium text-accent hover:underline">
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}

export function FormAturSandi() {
  const [status, aksi, sedang] = useActionState(aturSandi, undefined);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian
        label={`Kata sandi baru (minimal ${PANJANG_SANDI_MIN} karakter)`}
        name="kataSandi"
        type="password"
        autoComplete="new-password"
        minLength={PANJANG_SANDI_MIN}
        required
      />
      <KolomIsian label="Ulangi kata sandi" name="ulangi" type="password" autoComplete="new-password" required />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan kata sandi"}
      </Button>
    </form>
  );
}
