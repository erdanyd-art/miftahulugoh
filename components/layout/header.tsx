import { Search } from "lucide-react";
import type { Peran } from "@/lib/nav";
import { MobileNav } from "./mobile-nav";

// Nama pengguna masih placeholder; diisi dari tabel profiles di Sprint 2.
export function Header({ peran, nama }: { peran: Peran; nama: string }) {
  const inisial = nama
    .split(" ")
    .map((k) => k[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <MobileNav peran={peran} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Selamat datang kembali,</p>
        <h1 className="truncate text-lg font-semibold sm:text-xl">{nama}</h1>
      </div>
      <label className="relative hidden md:block">
        <span className="sr-only">Cari</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Cari..."
          className="h-10 w-64 rounded-full border border-input bg-card pr-4 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
      </label>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
      >
        {inisial}
      </span>
    </header>
  );
}
