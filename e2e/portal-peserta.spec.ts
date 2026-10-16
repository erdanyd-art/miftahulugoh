import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

test("portal peserta: jadwal kelas dengan tautan Meet dari tutor dan riwayat pembayaran sendiri", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const kode = Date.now().toString(36);
  const meet = `https://meet.google.com/uji-${kode}`;
  const ketMurid = `SPP murid ${kode}`;
  const ketLain = `SPP orang lain ${kode}`;

  // Tutor pengampu kelas Bahasa Inggris (tutor2) mengisi tautan Meet
  await masuk(page, "tutor2@contoh.test");
  await page.goto("/jadwal-saya");
  await page.waitForLoadState("networkidle");
  const kartu = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Bahasa Inggris" }) });
  await kartu.getByLabel("Tautan Google Meet").fill(meet);
  await kartu.getByRole("button", { name: "Simpan tautan" }).click();
  await expect(kartu.getByRole("status")).toHaveText("Tautan Meet tersimpan.");
  await page.context().clearCookies();

  // Admin mencatat dua pembayaran: milik Peserta Lima dan milik peserta lain
  await masuk(page, "admin@contoh.test");
  for (const [peserta, ket, status] of [
    ["Peserta Lima", ketMurid, "belum_lunas"],
    ["Peserta Satu", ketLain, "lunas"],
  ] as const) {
    await page.goto("/pembayaran/baru");
    await page.waitForLoadState("networkidle");
    await page.getByRole("combobox", { name: "Peserta", exact: true }).selectOption({ label: peserta });
    await page.getByRole("textbox", { name: "Keterangan (mis. SPP Oktober, Infaq)", exact: true }).fill(ket);
    await page.getByLabel("Jumlah (Rp)").fill("175000");
    await page.getByRole("combobox", { name: "Status", exact: true }).selectOption(status);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/pesan=disimpan/);
  }

  // Peserta Lima (murid.contoh)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const murid = await ctx.newPage();
  await masuk(murid, "murid.contoh");
  await murid.goto("/jadwal-kelas");
  const jadwal = murid.getByRole("listitem").filter({ hasText: "Bahasa Inggris" });
  await expect(jadwal).toContainText("Rabu, 16.00–17.00 · Ustadzah Fulanah");
  const tautan = jadwal.getByRole("link", { name: /Masuk Google Meet/ });
  await expect(tautan).toHaveAttribute("href", meet);
  await expect(tautan).toHaveAttribute("target", "_blank");
  await expect(tautan).toHaveAttribute("rel", "noopener noreferrer");

  await murid.goto("/pembayaran-saya");
  const bayar = murid.getByRole("listitem").filter({ hasText: ketMurid });
  await expect(bayar).toContainText("Rp 175.000");
  await expect(bayar).toContainText("Belum Lunas");
  await expect(murid.getByText(ketLain)).toHaveCount(0);
  await expect(murid.getByText(/pembayaran belum lunas/)).toBeVisible();

  // Halaman staf tetap tertutup
  await murid.goto("/pembayaran");
  await expect(murid).toHaveURL(/\/tidak-berwenang$/);
  await ctx.close();
});

test("tutor dan admin tidak membuka halaman portal peserta", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  for (const jalur of ["/jadwal-kelas", "/pembayaran-saya"]) {
    await page.goto(jalur);
    await expect(page, jalur).toHaveURL(/\/tidak-berwenang$/);
  }
});
