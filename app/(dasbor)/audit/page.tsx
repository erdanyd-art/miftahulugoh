import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Audit" };

export default function Halaman() {
  return <HalamanSegera judul="Audit" sprint={7} untuk="admin" />;
}
