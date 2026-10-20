"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const TAUTAN = [
  { href: "#program", label: "Program" },
  { href: "#kurikulum", label: "Kurikulum" },
  { href: "#cara", label: "Cara belajar" },
  { href: "#daftar", label: "Daftar" },
];

// Menu ponsel (di bawah 768px): tombol ☰ membuka sidebar dari kanan. Di layar lebar menu pil biasa
// yang tampil (landing.css). Tutup: tombol ✕, Esc, ketuk latar, atau memilih tautan.
export function MenuPonsel({ urlMasuk }: { urlMasuk: string }) {
  const [buka, setBuka] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const el = panel.current;
    el?.querySelector<HTMLElement>("a")?.focus();
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
      // Fokus tetap di dalam panel selama terbuka
      if (e.key === "Tab" && el) {
        const fokus = el.querySelectorAll<HTMLElement>("a, button");
        const pertama = fokus[0];
        const terakhir = fokus[fokus.length - 1];
        if (e.shiftKey && document.activeElement === pertama) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && document.activeElement === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    };
    document.addEventListener("keydown", tekan);
    document.body.style.overflow = "hidden";
    const pemicu = tombol.current;
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = "";
      pemicu?.focus({ preventScroll: true });
    };
  }, [buka]);

  const tutup = () => setBuka(false);

  return (
    <>
      <button
        ref={tombol}
        type="button"
        className="lp-tombol-menu"
        aria-expanded={buka}
        aria-controls="menu-ponsel"
        onClick={() => setBuka(true)}
      >
        <span className="lp-sr">Buka menu</span>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className={`lp-sidebar-latar ${buka ? "lp-buka" : ""}`} aria-hidden="true" onClick={tutup} />

      <div
        ref={panel}
        id="menu-ponsel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`lp-sidebar ${buka ? "lp-buka" : ""}`}
        inert={!buka}
      >
        <div className="lp-sidebar-kepala">
          <button type="button" className="lp-tombol-tutup" onClick={tutup}>
            <span className="lp-sr">Tutup menu</span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="lp-logo">
            <Image src="/logo-tanda.png" alt="" width={488} height={226} className="lp-logo-gambar" />
            <span className="lp-logo-teks">
              <span className="lp-logo-nama">Miftah al-Lughah</span>
              <span className="lp-logo-sub">Program Bahasa Arab</span>
            </span>
          </span>
        </div>
        <nav aria-label="Menu ponsel" className="lp-sidebar-menu">
          {TAUTAN.map((t) => (
            <a key={t.href} href={t.href} onClick={tutup}>
              {t.label}
            </a>
          ))}
          <a href={urlMasuk} className="lp-sidebar-masuk">
            Masuk
          </a>
        </nav>
      </div>
    </>
  );
}
