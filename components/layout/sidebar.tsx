import type { Peran } from "@/lib/nav";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

// Sidebar desktop. Di layar kecil diganti MobileNav (menu geser).
export function Sidebar({ peran }: { peran: Peran }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-8 bg-sidebar px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <NavLinks peran={peran} />
    </aside>
  );
}
