import { Search } from "lucide-react";
import type { Peran } from "@/lib/nav";
import { MobileNav } from "./mobile-nav";

const labelPeran: Record<Peran, string> = { admin: "Admin", tutor: "Tutor" };

// Nama pengguna masih placeholder; diisi dari tabel profiles di Sprint 2.
export function Header({ peran, nama }: { peran: Peran; nama: string }) {
  const inisial = nama
    .split(" ")
    .map((k) => k[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8 lg:pt-6">
      <MobileNav peran={peran} />
      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        Selamat datang di <span className="font-semibold text-accent">Miftah al-Lughah</span>
      </p>
      <label className="relative hidden md:block">
        <span className="sr-only">Cari</span>
        <input
          type="search"
          placeholder="Cari..."
          className="h-10 w-64 rounded-full border border-input bg-card pr-12 pl-4 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          <Search className="size-4" />
        </span>
      </label>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pastel-ungu text-sm font-semibold text-foreground"
        >
          {inisial}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold">{nama}</span>
          <span className="block text-xs text-muted-foreground">{labelPeran[peran]}</span>
        </span>
      </div>
    </header>
  );
}
