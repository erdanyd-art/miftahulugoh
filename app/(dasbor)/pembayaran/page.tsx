import type { Metadata } from "next";
import { HalamanSegera } from "@/components/layout/halaman-segera";

export const metadata: Metadata = { title: "Pembayaran" };

export default function Halaman() {
  return <HalamanSegera judul="Pembayaran" sprint={6} untuk="admin" />;
}
