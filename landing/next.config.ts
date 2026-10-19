import type { NextConfig } from "next";

const pengembangan = process.env.NODE_ENV === "development";
const produksiVercel = process.env.VERCEL_ENV === "production";

// Landing page statis: tanpa database, tanpa kunci, font di-host sendiri. Semua sumber dari domain sendiri.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${pengembangan ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${pengembangan ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  ...(produksiVercel ? ["upgrade-insecure-requests"] : []),
].join("; ");

const headerKeamanan = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(produksiVercel ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Aplikasi ini berdiri sendiri di folder landing/ (repo yang sama dengan dashboard).
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{ source: "/(.*)", headers: headerKeamanan }];
  },
};

export default nextConfig;
