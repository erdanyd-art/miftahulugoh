import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

test("perubahan pengaturan tercatat di log audit beserta pelaku dan nilai sebelum/sesudah", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  const namaBaru = `Lembaga Uji ${Date.now()}`;
  await page.goto("/pengaturan");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Nama lembaga" }).fill(namaBaru);
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByRole("status")).toHaveText("Pengaturan tersimpan.");

  await page.goto("/audit?tabel=pengaturan");
  await page.waitForLoadState("networkidle");
  const entri = page.getByRole("main").getByRole("listitem").filter({ hasText: "oleh" }).first();
  await expect(entri).toContainText("Ubah");
  await expect(entri).toContainText("oleh Admin Contoh");
  await entri.getByText(/kolom berubah/).click();
  await expect(entri.getByText(namaBaru)).toBeVisible();

  // filter tabel lain tidak menampilkan entri pengaturan
  await page.goto("/audit?tabel=kas&dari=2000-01-01&sampai=2000-01-02");
  await expect(page.getByText("Tidak ada catatan audit yang cocok.")).toBeVisible();

  // kembalikan nama lembaga
  await page.goto("/pengaturan");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Nama lembaga" }).fill("Lembaga Miftah al-Lughah");
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByRole("status")).toHaveText("Pengaturan tersimpan.");
});

test("tutor tidak bisa membuka log audit", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/tidak-berwenang$/);
});
