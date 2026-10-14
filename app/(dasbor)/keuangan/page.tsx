import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Keuangan" };

export default function Halaman() {
  return <HalamanSegera judul="Keuangan" sprint={6} untuk="admin" />;
}
