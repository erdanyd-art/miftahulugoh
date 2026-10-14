import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Pengaturan" };

export default function Halaman() {
  return <HalamanSegera judul="Pengaturan" sprint={3} untuk="admin" />;
}
