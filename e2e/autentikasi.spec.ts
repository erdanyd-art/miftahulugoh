import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, email: string, sandi = SANDI) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

// Pesan galat form (Next.js juga punya elemen role="alert" untuk pengumuman navigasi).
const pesanGalat = (page: Page) => page.locator("form [role=alert]");
const menu = (page: Page) => page.getByRole("navigation", { name: "Menu utama" }).first();

test("belum masuk diarahkan ke halaman masuk", async ({ page }) => {
  await page.goto("/keuangan");
  await expect(page).toHaveURL(/\/masuk$/);
});

test("kata sandi salah memberi pesan umum", async ({ page }) => {
  await masuk(page, "admin@contoh.test", "salah-sekali-123");
  await expect(pesanGalat(page)).toHaveText("Email atau kata sandi salah.");
  await expect(page.getByLabel("Email")).toHaveValue("admin@contoh.test");
});

test("email tak terdaftar memberi pesan yang sama", async ({ page }) => {
  await masuk(page, "tidak-ada@contoh.test");
  await expect(pesanGalat(page)).toHaveText("Email atau kata sandi salah.");
});

test("admin masuk, melihat menu admin, lalu keluar", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Admin Contoh")).toBeVisible();
  await expect(menu(page).getByRole("link", { name: "Pengguna" })).toBeAttached();
  await expect(menu(page).getByRole("link", { name: "Keuangan" })).toBeAttached();

  await page.goto("/keuangan");
  await expect(page.getByRole("heading", { name: "Keuangan" })).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/masuk$/);
});

test("tutor melihat menu tutor dan ditolak di halaman admin", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  await expect(page.getByText("Ustadz Fulan")).toBeVisible();
  await expect(menu(page).getByRole("link", { name: "Jadwal Saya" })).toBeAttached();
  await expect(menu(page).getByRole("link", { name: "Keuangan" })).toHaveCount(0);

  for (const jalur of ["/keuangan", "/pembayaran", "/pengguna"]) {
    await page.goto(jalur);
    await expect(page).toHaveURL(/\/tidak-berwenang$/);
  }
});

test("tutor nonaktif tidak bisa masuk", async ({ page }) => {
  await masuk(page, "tutor3@contoh.test");
  await expect(pesanGalat(page)).toContainText("tidak aktif");
  await page.goto("/");
  await expect(page).toHaveURL(/\/masuk$/);
});

test("akun tanpa profil tidak bisa masuk", async ({ page }) => {
  await masuk(page, "tanpaprofil@contoh.test");
  await expect(pesanGalat(page)).toContainText("tidak aktif");
});

test("lupa kata sandi memberi pesan yang sama untuk email apa pun", async ({ page }) => {
  await page.goto("/lupa-sandi");
  await page.getByLabel("Email").fill("tidak-ada@contoh.test");
  await page.getByRole("button", { name: "Kirim tautan" }).click();
  await expect(page.getByRole("status")).toContainText("Jika email terdaftar");
});
