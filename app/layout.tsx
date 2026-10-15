import type { Metadata } from "next";
import { Fredoka, Noto_Naskh_Arabic, Righteous } from "next/font/google";
import "./globals.css";

// Isi: Fredoka (bulat, mudah dibaca). Judul: Righteous (berkarakter, satu ketebalan).
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const righteous = Righteous({
  variable: "--font-righteous",
  subsets: ["latin"],
  weight: "400",
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: { default: "Lembaga Miftah al-Lughah", template: "%s · Miftah al-Lughah" },
  description: "Dashboard administrasi Lembaga Miftah al-Lughah",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${fredoka.variable} ${righteous.variable} ${naskh.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
