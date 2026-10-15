import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

async function buka(page: Page, jalur: string) {
  await page.goto(jalur);
  await page.waitForLoadState("networkidle"); // tunggu halaman selesai di-stream sebelum mengisi form
}

const isian = (page: Page, nama: string) => page.getByRole("textbox", { name: nama, exact: true });
const pilihan = (page: Page, nama: string) => page.getByRole("combobox", { name: nama, exact: true });
const galat = (page: Page) => page.locator("form [role=alert]");

test.describe.configure({ mode: "serial" });

const kode = Date.now();
const namaPeserta = `Peserta Uji ${kode}`;
const namaKelas = `Kelas Uji ${kode}`;

test("admin menambah peserta dan kelas, lalu mengelola anggota kelas", async ({ page }) => {
  await masuk(page, "admin@contoh.test");

  await buka(page, "/peserta/baru");
  await isian(page, "Nama peserta").fill(namaPeserta);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/peserta\/[0-9a-f-]+\?pesan=disimpan/);
  await expect(page.getByRole("heading", { name: namaPeserta })).toBeVisible();

  await buka(page, "/kelas/baru");
  await isian(page, "Nama kelas (sudah mewakili mata pelajaran)").fill(namaKelas);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/kelas\/[0-9a-f-]+\?pesan=disimpan/);
  await page.waitForLoadState("networkidle");

  await pilihan(page, "Tambah peserta").selectOption({ label: namaPeserta });
  await page.getByRole("button", { name: "Tambahkan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Peserta ditambahkan" })).toBeVisible();
  await expect(page.getByRole("link", { name: namaPeserta })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Anggota kelas (1)" })).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: `Keluarkan ${namaPeserta}` }).click();
  await expect(page.getByRole("heading", { name: "Anggota kelas (0)" })).toBeVisible();

  // tambahkan lagi untuk dipakai tutor nanti
  await pilihan(page, "Tambah peserta").selectOption({ label: namaPeserta });
  await page.getByRole("button", { name: "Tambahkan" }).click();
  await expect(page.getByRole("heading", { name: "Anggota kelas (1)" })).toBeVisible();
});

test("nama kelas ganda ditolak", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, "/kelas/baru");
  await isian(page, "Nama kelas (sudah mewakili mata pelajaran)").fill(namaKelas.toUpperCase());
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(galat(page)).toHaveText("Nama kelas sudah dipakai kelas lain.");
});

test("admin membuat jadwal; jam dan tautan Meet yang salah ditolak", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, "/jadwal/baru");
  await pilihan(page, "Kelas").selectOption({ label: namaKelas });
  await pilihan(page, "Tutor").selectOption({ label: "Ustadz Fulan" });
  await pilihan(page, "Hari").selectOption({ label: "Sabtu" });
  await page.getByLabel("Honor per sesi (Rp)").fill("75000");
  await page.getByLabel("Jam mulai").fill("10:00");
  await page.getByLabel("Jam selesai").fill("09:00");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(galat(page)).toHaveText("Jam selesai harus setelah jam mulai.");
  // isian tidak hilang setelah ditolak server (termasuk dropdown)
  await expect(pilihan(page, "Kelas")).not.toHaveValue("");
  await expect(pilihan(page, "Tutor")).not.toHaveValue("");
  await expect(page.getByLabel("Honor per sesi (Rp)")).toHaveValue("75000");

  await page.getByLabel("Jam selesai").fill("11:30");
  await page.getByLabel("Tautan Google Meet (opsional)").fill("http://meet.google.com/tidak-aman");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(galat(page)).toContainText("https://");

  await page.getByLabel("Tautan Google Meet (opsional)").fill("");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/jadwal\/[0-9a-f-]+\?pesan=disimpan/);
  await expect(page.getByRole("heading", { name: `${namaKelas} · Sabtu 10.00` })).toBeVisible();

  await buka(page, `/jadwal?hari=6&q=${encodeURIComponent(namaKelas)}`);
  await expect(page.getByRole("link", { name: new RegExp(namaKelas) })).toBeVisible();
  await buka(page, `/jadwal?hari=1&q=${encodeURIComponent(namaKelas)}`);
  await expect(page.getByText("Tidak ada jadwal yang cocok.")).toBeVisible();
});

test("tutor melihat jadwal dan kelas miliknya, dan mengubah tautan Meet", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  await buka(page, "/jadwal-saya");
  const kartu = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: namaKelas }) });
  await expect(kartu).toBeVisible();

  await kartu.getByLabel("Tautan Google Meet").fill("http://meet.google.com/x");
  await kartu.getByRole("button", { name: "Simpan tautan" }).click();
  await expect(kartu.locator("[role=alert]")).toContainText("https://");

  await kartu.getByLabel("Tautan Google Meet").fill("https://meet.google.com/uji-abc-def");
  await kartu.getByRole("button", { name: "Simpan tautan" }).click();
  await expect(kartu.getByRole("status")).toHaveText("Tautan Meet tersimpan.");
  await expect(kartu.getByRole("link", { name: "Buka Google Meet" })).toHaveAttribute(
    "href",
    "https://meet.google.com/uji-abc-def",
  );
  await expect(kartu.getByRole("link", { name: "Buka Google Meet" })).toHaveAttribute("rel", "noopener noreferrer");

  await buka(page, "/kelas-saya");
  const kelas = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: namaKelas }) });
  await expect(kelas.getByText(namaPeserta)).toBeVisible();
});

test("tutor lain tidak melihat jadwal dan kelas itu", async ({ page }) => {
  await masuk(page, "tutor2@contoh.test");
  await buka(page, "/jadwal-saya");
  await expect(page.getByRole("heading", { name: namaKelas })).toHaveCount(0);
  await buka(page, "/kelas-saya");
  await expect(page.getByRole("heading", { name: namaKelas })).toHaveCount(0);
});

test("tutor ditolak di halaman data master admin", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  for (const jalur of ["/peserta", "/peserta/baru", "/kelas", "/kelas/baru", "/jadwal", "/jadwal/baru"]) {
    await page.goto(jalur);
    await expect(page).toHaveURL(/\/tidak-berwenang$/);
  }
});

test("cari peserta dan filter status", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, `/peserta?q=${encodeURIComponent(namaPeserta)}`);
  await expect(page.getByRole("link", { name: new RegExp(namaPeserta) })).toBeVisible();
  await buka(page, `/peserta?q=${encodeURIComponent(namaPeserta)}&status=nonaktif`);
  await expect(page.getByText("Tidak ada peserta yang cocok.")).toBeVisible();
});
