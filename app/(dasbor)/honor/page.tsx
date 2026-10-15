import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Honor" };

export default function Halaman() {
  return <HalamanSegera judul="Honor" sprint={5} untuk="admin" />;
}
