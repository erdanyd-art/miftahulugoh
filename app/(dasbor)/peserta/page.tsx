import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Peserta" };

export default function Halaman() {
  return <HalamanSegera judul="Peserta" sprint={4} untuk="admin" />;
}
