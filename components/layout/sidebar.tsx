import type { Peran } from "@/lib/nav";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

// Sidebar desktop berlabel (ikon + nama menu) di atas bingkai navy. Di layar kecil diganti MobileNav.
export function Sidebar({ peran }: { peran: Peran }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-8 overflow-y-auto px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <NavLinks peran={peran} />
    </aside>
  );
}
