import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Lembaga Miftah al-Lughah",
  description: "Dashboard administrasi Lembaga Miftah al-Lughah",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${naskh.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
