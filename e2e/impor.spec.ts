import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

async function unggah(page: Page, nama: string, isi: string) {
  await page.getByLabel("Berkas CSV").setInputFiles({ name: nama, mimeType: "text/csv", buffer: Buffer.from(isi, "utf-8") });
}

test.describe.configure({ mode: "serial" });
const kode = Date.now();

test("berkas bermasalah: pratinjau menandai baris dan impor tidak bisa dijalankan", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/peserta/impor");
  await page.waitForLoadState("networkidle");
  await unggah(
    page,
    "salah.csv",
    `nama,kelas\nBaru ${kode},Kelas Tidak Ada\nGanda ${kode},\nganda ${kode},\nPeserta Satu,\n,Bahasa Arab Dasar\n`,
  );
  // baris "Ganda" pertama valid; salinannya (beda huruf besar-kecil) bermasalah
  await expect(page.getByText("1 siap diimpor")).toBeVisible();
  await expect(page.getByText("1 dilewati")).toBeVisible();
  await expect(page.getByText("3 bermasalah")).toBeVisible();
  await expect(page.getByText("Kelas tidak ditemukan: Kelas Tidak Ada")).toBeVisible();
  await expect(page.getByText("Nama sama dengan baris 3")).toBeVisible();
  await expect(page.getByText("Nama kosong")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Impor \d+ peserta$/ })).toBeDisabled();
});

test("berkas valid (titik koma, BOM, banyak kelas): peserta dan keanggotaan kelas tersimpan", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/peserta/impor");
  await page.waitForLoadState("networkidle");
  const isi =
    "﻿Nama Siswa;Keterangan;Kelas\r\n" +
    `Impor A ${kode};anak baru;Bahasa Arab Dasar|Nahwu Shorof\r\n` +
    `"Impor, B ${kode}";;bahasa inggris\r\n` +
    "Peserta Dua;;\r\n";
  await unggah(page, "siswa.csv", isi);
  await expect(page.getByText("2 siap diimpor")).toBeVisible();
  await expect(page.getByText("1 dilewati")).toBeVisible();
  await page.getByRole("button", { name: "Impor 2 peserta" }).click();
  await expect(page.getByRole("status")).toHaveText("2 peserta berhasil diimpor, 1 dilewati karena sudah ada.");

  await page.goto(`/peserta?q=${kode}`);
  await expect(page.getByRole("link", { name: new RegExp(`Impor A ${kode}.*Bahasa Arab Dasar, Nahwu Shorof`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`Impor, B ${kode}.*Bahasa Inggris`) })).toBeVisible();

  // impor ulang berkas yang sama: semua dilewati, tidak dobel
  await page.goto("/peserta/impor");
  await page.waitForLoadState("networkidle");
  await unggah(page, "siswa.csv", isi);
  await expect(page.getByText("0 siap diimpor")).toBeVisible();
  await expect(page.getByText("3 dilewati")).toBeVisible();
});

test("templat CSV bisa diunduh admin; tutor ditolak", async ({ page, browser }) => {
  await masuk(page, "admin@contoh.test");
  const res = await page.request.get("/ekspor/templat-peserta");
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect((await res.text()).startsWith("﻿nama,catatan,kelas")).toBe(true);

  const tutor = await (await browser.newContext()).newPage();
  await masuk(tutor, "tutor1@contoh.test");
  await tutor.goto("/peserta/impor");
  await expect(tutor).toHaveURL(/\/tidak-berwenang$/);
  const templat = await tutor.request.get("/ekspor/templat-peserta");
  expect(templat.url()).toMatch(/\/tidak-berwenang$/);
});
