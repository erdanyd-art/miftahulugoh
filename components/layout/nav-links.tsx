"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { menuPerPeran, type Peran } from "@/lib/nav";

// Ikon adalah komponen, jadi menu dipilih di sisi klien dari nama peran (bukan dikirim dari server).
// ringkas: hanya ikon (sidebar desktop); label tetap ada untuk pembaca layar dan tooltip.
export function NavLinks({
  peran,
  ringkas = false,
  onNavigate,
}: {
  peran: Peran;
  ringkas?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = menuPerPeran[peran];

  return (
    <nav aria-label="Menu utama">
      <ul className={cn("flex flex-col", ringkas ? "items-center gap-2" : "gap-1")}>
        {items.map(({ label, href, icon: Icon }) => {
          const aktif = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                title={ringkas ? label : undefined}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex items-center transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                  ringkas
                    ? "size-11 justify-center rounded-xl"
                    : "gap-3 rounded-xl px-4 py-2.5 text-sm font-medium",
                  aktif
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-border hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className={ringkas ? "sr-only" : undefined}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
