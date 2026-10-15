"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TAB = [
  { href: "/keuangan", label: "Kas" },
  { href: "/keuangan/rekap", label: "Rekap bulanan" },
  { href: "/keuangan/kategori", label: "Kategori" },
];

export function TabKeuangan() {
  const pathname = usePathname();
  return (
    <nav aria-label="Bagian keuangan" className="flex flex-wrap gap-2">
      {TAB.map((t) => {
        const aktif = t.href === "/keuangan" ? pathname === "/keuangan" || /^\/keuangan\/(baru|[0-9a-f-]{36})/.test(pathname) : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              aktif ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
