"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { menuPerPeran, type Peran } from "@/lib/nav";

// Ikon adalah komponen, jadi menu dipilih di sisi klien dari nama peran (bukan dikirim dari server).
export function NavLinks({ peran, onNavigate }: { peran: Peran; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = menuPerPeran[peran];

  return (
    <nav aria-label="Menu utama">
      <ul className="flex flex-col gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const aktif = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                  aktif
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-border hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
