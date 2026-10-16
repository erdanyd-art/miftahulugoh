import type { Metadata } from "next";
import { Amiri, Bricolage_Grotesque } from "next/font/google";
import { Band } from "@/components/landing/art";
import { Hero, Nav } from "@/components/landing/hero";
import { CaraBelajar, Daftar, Footer, Program } from "@/components/landing/seksi";
import { Gerak } from "@/components/landing/gerak";
import "@/components/landing/landing.css";
import { siteContent, tautanWhatsApp, urlSitus } from "@/lib/site-content";

// Landing page publik. Ditampilkan di "/" untuk pengunjung yang belum masuk (rewrite di proxy.ts);
// pengguna yang sudah masuk tetap melihat dashboard di "/". Statis: tanpa database, tanpa kunci.
// Font di-host sendiri saat build (next/font), tanpa permintaan ke Google saat runtime.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage" });
// Amiri hanya untuk hiasan/label Arab: tidak di-preload agar teks utama (LCP) tampil lebih cepat.
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri", preload: false });

const JUDUL = "Lembaga Miftah al-Lughah — Kursus Bahasa Arab & Inggris Online";
const DESKRIPSI = "Kelas Bahasa Arab, Bahasa Inggris, dan Nahwu Shorof secara online lewat Google Meet.";

export const metadata: Metadata = {
  metadataBase: new URL(urlSitus()),
  title: { absolute: JUDUL },
  description: DESKRIPSI,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Lembaga Miftah al-Lughah",
    title: JUDUL,
    description: DESKRIPSI,
  },
};

export default function HalamanLanding() {
  const tautanDaftar = tautanWhatsApp(siteContent.waNumber, siteContent.waMessage);
  return (
    <div className={`${bricolage.variable} ${amiri.variable} lp-halaman`}>
      <Nav />
      <main>
        <Hero tautanDaftar={tautanDaftar} />
        <Band />
        <Program />
        <CaraBelajar />
        <Daftar />
      </main>
      <Footer />
      <Gerak />
    </div>
  );
}
