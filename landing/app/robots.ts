import type { MetadataRoute } from "next";
import { urlSitus } from "@/lib/site-content";

// Landing page boleh diindeks. Dashboard ada di situs terpisah dan memakai noindex sendiri.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${urlSitus()}/sitemap.xml`,
  };
}
