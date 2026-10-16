import type { MetadataRoute } from "next";
import { urlSitus } from "@/lib/site-content";

// Hanya landing page (/) yang diindeks. Halaman lain tidak diblokir di sini agar mesin pencari
// bisa membaca header X-Robots-Tag: noindex (next.config.ts) yang menolak pengindeksannya.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${urlSitus()}/sitemap.xml`,
  };
}
