import type { MetadataRoute } from "next";

// Dashboard tidak untuk mesin pencari. Landing page publik adalah situs terpisah (landing/).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
