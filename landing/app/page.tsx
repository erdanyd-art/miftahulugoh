import type { Metadata } from "next";
import { Band } from "@/components/art";
import { Hero, Nav } from "@/components/hero";
import { CaraBelajar, Daftar, Footer, Kurikulum, Program } from "@/components/seksi";
import { Gerak } from "@/components/gerak";
import { siteContent, tautanWhatsApp, urlSitus } from "@/lib/site-content";

// Landing page publik (situs terpisah dari dashboard). Statis: tanpa database, tanpa kunci.

const JUDUL = "Lembaga Miftah al-Lughah — Kursus Bahasa Arab Online (Kitab ABY 1–8)";
const DESKRIPSI =
  "Kelas Bahasa Arab online dengan Kitab ABY, 8 tingkat pembelajaran. Pilih kelas Reguler, Semi Privat, atau Privat.";

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
    <div className="lp-halaman">
      <Nav />
      <main>
        <Hero tautanDaftar={tautanDaftar} />
        <Band jumlahTingkat={siteContent.jumlahTingkat} />
        <Program />
        <Kurikulum />
        <CaraBelajar />
        <Daftar />
      </main>
      <Footer />
      <Gerak />
    </div>
  );
}
