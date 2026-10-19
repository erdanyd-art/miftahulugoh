import { defineConfig } from "@playwright/test";

// E2E landing page. Tidak butuh Supabase: halaman statis.
export default defineConfig({
  testDir: "e2e",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3002",
    // Lokal memakai Google Chrome yang terpasang; CI memakai Chromium bawaan Playwright.
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
