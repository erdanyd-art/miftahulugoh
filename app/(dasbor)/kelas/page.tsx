import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Kelas" };

export default function Halaman() {
  return <HalamanSegera judul="Kelas" sprint={4} untuk="admin" />;
}
