"use client";

import { startTransition, useActionState, type FormEvent } from "react";

type Status = { galat?: string; pesan?: string } | undefined;

// Seperti useActionState, tetapi form TIDAK direset otomatis oleh React setelah aksi:
// bila server menolak (mis. jam salah), isian pengguna tetap ada, termasuk pilihan dropdown.
export function useFormAksi(aksi: (status: Status, data: FormData) => Promise<Status>) {
  const [status, kirim, sedang] = useActionState(aksi, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => kirim(data));
  };
  return { status, onSubmit, sedang };
}
