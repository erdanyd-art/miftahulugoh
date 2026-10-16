import type { MetadataRoute } from "next";
import { urlSitus } from "@/lib/site-content";

// Hanya landing page.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${urlSitus()}/` }];
}
