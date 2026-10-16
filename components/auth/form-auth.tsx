"use client";

import Link from "next/link";
import { useActionState, useId, useState, type InputHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { aturSandi, gantiSandi, lupaSandi, masuk } from "@/lib/aksi-auth";
import { PANJANG_SANDI_MIN } from "@/lib/validasi/auth";
import { KolomIsian, PesanStatus } from "./bingkai-auth";

const kelasTombol = "h-12 w-full rounded-xl bg-hangat text-base font-semibold text-primary hover:bg-hangat/85";
const kelasTautan = "text-sm font-medium text-primary underline-offset-4 hover:underline";

// Kolom kata sandi dengan tombol lihat/sembunyikan (nyaman saat mengetik di ponsel).
// Tombol sengaja di luar <label> agar nama aksesibel kolom tetap persis teks label.
function KolomSandi({ label, ...props }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [terlihat, setTerlihat] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={terlihat ? "text" : "password"}
          className="h-11 w-full rounded-xl border border-input bg-card pr-28 pl-4 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring"
        />
        <button
          type="button"
          onClick={() => setTerlihat((v) => !v)}
          aria-label={terlihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={terlihat}
          aria-controls={id}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {terlihat ? "Sembunyikan" : "Lihat"}
        </button>
      </div>
    </div>
  );
}

export function FormMasuk() {
  const [status, aksi, sedang] = useActionState(masuk, undefined);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <PesanStatus galat={status?.galat} />
      <KolomIsian
        label="Email atau username"
        name="email"
        type="text"
        autoCapitalize="none"
        autoComplete="username"
        defaultValue={status?.email}
        required
      />
      <KolomSandi label="Kata sandi" name="kataSandi" autoComplete="current-password" required />
      <Link href="/lupa-sandi" className={`${kelasTautan} w-fit`}>
        Lupa kata sandi?
      </Link>
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Memproses..." : "Masuk"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Belum punya akun? Akun dibuat oleh admin lembaga.
      </p>
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
      <Link href="/masuk" className={`${kelasTautan} text-center`}>
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
      <KolomSandi
        label={`Kata sandi baru (minimal ${PANJANG_SANDI_MIN} karakter)`}
        name="kataSandi"
        autoComplete="new-password"
        minLength={PANJANG_SANDI_MIN}
        required
      />
      <KolomSandi label="Ulangi kata sandi" name="ulangi" autoComplete="new-password" required />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan kata sandi"}
      </Button>
    </form>
  );
}

// Di dalam dashboard (halaman Akun saya), untuk semua peran.
export function FormGantiSandi() {
  const [status, aksi, sedang] = useActionState(gantiSandi, undefined);
  return (
    <form action={aksi} className="flex max-w-md flex-col gap-4">
      <PesanStatus {...status} />
      <KolomSandi label="Kata sandi lama" name="sandiLama" autoComplete="current-password" required />
      <KolomSandi
        label={`Kata sandi baru (minimal ${PANJANG_SANDI_MIN} karakter)`}
        name="kataSandi"
        autoComplete="new-password"
        minLength={PANJANG_SANDI_MIN}
        required
      />
      <KolomSandi label="Ulangi kata sandi baru" name="ulangi" autoComplete="new-password" required />
      <Button type="submit" disabled={sedang} className="h-11 w-fit rounded-xl px-6">
        {sedang ? "Menyimpan..." : "Ganti kata sandi"}
      </Button>
    </form>
  );
}
