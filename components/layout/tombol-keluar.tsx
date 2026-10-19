"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { OverlayMemuat } from "@/components/overlay-memuat";
import { keluar } from "@/lib/aksi-auth";

function Isi() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        title="Keluar"
        disabled={pending}
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
      >
        <LogOut className="size-5" aria-hidden />
        <span className="sr-only">Keluar</span>
      </button>
      {pending && <OverlayMemuat pesan="Sedang keluar..." />}
    </>
  );
}

export function TombolKeluar() {
  return (
    <form action={keluar}>
      <Isi />
    </form>
  );
}
