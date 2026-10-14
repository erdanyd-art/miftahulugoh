import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Honor Saya" };

export default function Halaman() {
  return <HalamanSegera judul="Honor Saya" sprint={5} untuk="tutor" />;
}
