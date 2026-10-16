import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

const HALAMAN_ADMIN = [
  "/",
  "/kelas",
  "/kelas/baru",
  "/peserta",
  "/peserta/baru",
  "/peserta/impor",
  "/jadwal",
  "/jadwal/baru",
  "/absensi",
  "/honor",
  "/pembayaran",
  "/pembayaran/baru",
  "/keuangan",
  "/keuangan/baru",
  "/keuangan/rekap",
  "/keuangan/kategori",
  "/pengguna",
  "/pengguna/baru",
  "/pengaturan",
  "/audit",
  "/ujian",
  "/ujian/baru",
  "/akun",
];
const HALAMAN_TUTOR = ["/", "/jadwal-saya", "/kelas-saya", "/absensi", "/honor-saya", "/akun"];
const HALAMAN_PUBLIK = ["/masuk", "/lupa-sandi"];
const HALAMAN_PESERTA = ["/", "/akun"];

async function masuk(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

// Periksa satu halaman: tanpa pelanggaran axe serius/kritis (WCAG A/AA), tanpa galat konsol (termasuk CSP),
// dan tanpa geser horizontal di layar ponsel.
async function periksa(page: Page, jalur: string) {
  const galat: string[] = [];
  const catat = (m: { type(): string; text(): string }) => {
    if (m.type() === "error") galat.push(m.text());
  };
  page.on("console", catat);
  page.on("pageerror", (e) => galat.push(e.message));

  await page.goto(jalur);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1").first()).toBeVisible();

  const hasil = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const berat = hasil.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}x) ${v.nodes[0]?.target.join(" ")}`);
  expect(berat, `axe ${jalur}`).toEqual([]);

  const lebar = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(lebar, `geser horizontal di ${jalur}`).toBeLessThanOrEqual(0);

  page.off("console", catat);
  expect(galat.filter((g) => !g.includes("favicon")), `galat konsol ${jalur}`).toEqual([]);
}

test.describe("aksesibilitas, CSP, dan tampilan ponsel", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("halaman publik", async ({ page }) => {
    for (const jalur of HALAMAN_PUBLIK) await periksa(page, jalur);
  });

  test("halaman admin", async ({ page }) => {
    test.setTimeout(120_000);
    await masuk(page, "admin@contoh.test");
    for (const jalur of HALAMAN_ADMIN) await periksa(page, jalur);
  });

  test("halaman tutor", async ({ page }) => {
    await masuk(page, "tutor1@contoh.test");
    for (const jalur of HALAMAN_TUTOR) await periksa(page, jalur);
  });

  test("halaman peserta", async ({ page }) => {
    await masuk(page, "murid.contoh");
    for (const jalur of HALAMAN_PESERTA) await periksa(page, jalur);
  });
});

test("header keamanan terpasang", async ({ request }) => {
  const res = await request.get("/masuk");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});
