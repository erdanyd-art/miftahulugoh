"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Peran } from "@/lib/nav";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

export function MobileNav({ peran }: { peran: Peran }) {
  const [buka, setBuka] = useState(false);

  return (
    <Sheet open={buka} onOpenChange={setBuka}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-sidebar px-4 py-6">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <NavLinks peran={peran} onNavigate={() => setBuka(false)} />
      </SheetContent>
    </Sheet>
  );
}
