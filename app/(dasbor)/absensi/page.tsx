import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Absensi" };

export default function Halaman() {
  return <HalamanSegera judul="Absensi" sprint={5} />;
}
