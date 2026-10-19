import type { Metadata } from "next";
import { Amiri, Bricolage_Grotesque } from "next/font/google";
import "./landing.css";

// Font di-host sendiri saat build (next/font), tanpa permintaan ke Google saat runtime.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage" });
// Amiri hanya untuk hiasan/label Arab: tidak di-preload agar teks utama (LCP) tampil lebih cepat.
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri", preload: false });

export const metadata: Metadata = {
  title: "Lembaga Miftah al-Lughah",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${bricolage.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
