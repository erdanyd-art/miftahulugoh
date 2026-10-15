import type { Peran } from "@/lib/nav";
import { LogoTanda } from "./logo";
import { NavLinks } from "./nav-links";

// Sidebar desktop: hanya ikon di atas bingkai navy. Di layar kecil diganti MobileNav (menu geser berlabel).
export function Sidebar({ peran }: { peran: Peran }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-8 py-6 lg:flex">
      <LogoTanda />
      <NavLinks peran={peran} ringkas />
    </aside>
  );
}
