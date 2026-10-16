import type { NextConfig } from "next";

const pengembangan = process.env.NODE_ENV === "development";
const produksiVercel = process.env.VERCEL_ENV === "production";

// CSP tanpa nonce (pola "Without Nonces" di dokumentasi Next): halaman statis tetap bisa diprerender.
// script-src masih mengizinkan inline script milik Next; risikonya ditekan karena tidak ada
// dangerouslySetInnerHTML dan semua teks pengguna di-escape React (security-checklist D4, D7).
// Browser hanya menghubungi Supabase untuk dua hal (sisanya lewat server): mengunggah audio ujian lewat
// tautan unggah sekali pakai (connect-src) dan memutar audio lewat tautan bertanda tangan (media-src).
const supabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${pengembangan ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `media-src 'self' ${supabase}`.trim(),
  `connect-src 'self' ${supabase}${pengembangan ? " ws: wss:" : ""}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(produksiVercel ? ["upgrade-insecure-requests"] : []),
].join("; ");

const headerKeamanan = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS hanya di domain produksi (HTTPS); di lokal http akan mengganggu.
  ...(produksiVercel ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: headerKeamanan }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
