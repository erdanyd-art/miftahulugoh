import { expect, test } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql
const LEBAR = [360, 390, 768, 1024, 1440];

test("pengunjung melihat landing page di / dan tombol Masuk membuka /masuk", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Buka\s+kunci\s+bahasa Arab & Inggrismu/i);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Pilih kelasmu",
    "Tiga langkah, langsung belajar",
    "Siap masuk kelas?",
  ]);
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(6);

  // Placeholder selama lib/site-content.ts kosong
  await expect(page.getByText("[NOMOR WHATSAPP]")).toBeVisible();
  await expect(page.getByText("[@AKUN INSTAGRAM]")).toBeVisible();
  await expect(page.getByText("[ALAMAT / KOTA]")).toBeVisible();
  await expect(page.getByText("[HARI & JAM]")).toHaveCount(3);
  await expect(page.getByText("[BIAYA / BULAN]")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Chat WhatsApp" })).toHaveAttribute("href", "#daftar");
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);

  // Teks Arab yang dibaca pembaca layar (label program) memakai lang/dir yang benar
  const label = page.getByText("العربية", { exact: true });
  await expect(label).toHaveAttribute("dir", "rtl");
  await expect(label).toHaveAttribute("lang", "ar");

  // Tidak ada formulir di landing page
  await expect(page.locator("form")).toHaveCount(0);

  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
});

test("landing page hanya memuat sumber dari domain sendiri (font di-host sendiri)", async ({ page }) => {
  const luar: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:3000")) luar.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(luar).toEqual([]);
  const font = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
  expect(font).toMatch(/Bricolage/i);
});

for (const lebar of LEBAR) {
  test(`tanpa geser horizontal di ${lebar}px`, async ({ page }) => {
    await page.setViewportSize({ width: lebar, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const lebih = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(lebih).toBeLessThanOrEqual(0);
  });
}

test("pengguna yang sudah masuk tetap melihat dashboard di /", async ({ page }) => {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill("admin@contoh.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Admin Contoh")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Admin Contoh")).toBeVisible();
  await expect(page.getByText("[NOMOR WHATSAPP]")).toHaveCount(0);
});

test("hanya / yang boleh diindeks", async ({ request }) => {
  const beranda = await request.get("/");
  expect(beranda.headers()["x-robots-tag"]).toBeUndefined();
  expect(await beranda.text()).toContain('rel="canonical"');

  for (const jalur of ["/masuk", "/lupa-sandi", "/landing"]) {
    const res = await request.get(jalur, { maxRedirects: 0 });
    expect(res.headers()["x-robots-tag"], jalur).toContain("noindex");
  }

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toMatch(/Sitemap: .*\/sitemap\.xml/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
});
