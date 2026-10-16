"use client";

import { useEffect } from "react";

// Kemiringan 3D mengikuti kursor untuk elemen [data-tilt] di landing page (nilai = derajat maksimum).
// Hanya mouse/pen (layar sentuh tidak punya kursor) dan tidak aktif bila pengguna memilih "kurangi gerakan".
// Hanya mengisi variabel CSS --rx/--ry; gaya dan transisinya ada di landing.css.
export function Gerak() {
  useEffect(() => {
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lepas: (() => void)[] = [];

    for (const el of document.querySelectorAll<HTMLElement>("[data-tilt]")) {
      const maks = Number(el.dataset.tilt) || 8;
      const gerak = (e: PointerEvent) => {
        if (e.pointerType === "touch" || kurangiGerak.matches) return;
        const kotak = el.getBoundingClientRect();
        const x = (e.clientX - kotak.left) / kotak.width - 0.5;
        const y = (e.clientY - kotak.top) / kotak.height - 0.5;
        el.style.setProperty("--ry", `${(x * maks * 2).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * maks * 2).toFixed(2)}deg`);
      };
      const keluar = () => {
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      };
      el.addEventListener("pointermove", gerak);
      el.addEventListener("pointerleave", keluar);
      lepas.push(() => {
        el.removeEventListener("pointermove", gerak);
        el.removeEventListener("pointerleave", keluar);
      });
    }

    return () => lepas.forEach((f) => f());
  }, []);

  return null;
}
