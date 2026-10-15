import { defineConfig } from "@playwright/test";

// E2E butuh Supabase lokal menyala (npx supabase start) dengan seed fiktif.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // Semua tes memakai data seed yang sama (sesi, pengaturan), jadi dijalankan berurutan.
  workers: 1,
  // Server dev/CI bisa lambat saat mesin sibuk; beri waktu tunggu lebih longgar untuk tiap pemeriksaan.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    // Lokal memakai Google Chrome yang terpasang; CI memakai Chromium bawaan Playwright.
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    // CI menguji hasil build produksi; lokal memakai server dev yang mungkin sudah jalan.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000/masuk",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
