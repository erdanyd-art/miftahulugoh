import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Jadwal Saya" };

export default function Halaman() {
  return <HalamanSegera judul="Jadwal Saya" sprint={4} untuk="tutor" />;
}
