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
  await page.waitForLoadState("networkidle");
}

const pilihan = (page: Page, nama: string) => page.getByRole("combobox", { name: nama, exact: true });
const isian = (page: Page, nama: string) => page.getByRole("textbox", { name: nama, exact: true });

test.describe.configure({ mode: "serial" });

const kode = Date.now();
const formulaJahat = `=HYPERLINK("http://jahat.example","klik") ${kode}`;
const ketHapus = `Akan dihapus ${kode}`;
const ketSpp = `SPP uji ${kode}`;

function rupiahKeAngka(teks: string) {
  return Number(teks.replace(/[^\d]/g, ""));
}

test("admin mencatat kas: pemasukan, Honor Tutor (wajib tutor) mengurangi saldo, lalu hapus", async ({ page }) => {
  await masuk(page, "admin@contoh.test");

  await buka(page, "/honor");
  const barisFulan = page.getByRole("link", { name: /^Ustadz Fulan/ }).first();
  const dibayarAwal = rupiahKeAngka((await barisFulan.locator('[data-kolom="dibayar"]').textContent()) ?? "0");

  await buka(page, "/keuangan/baru");
  await pilihan(page, "Kategori").selectOption({ label: "Donasi" });
  await page.getByLabel("Jumlah (Rp)").fill("500000");
  await isian(page, "Keterangan (opsional)").fill(formulaJahat);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/keuangan\?bulan=\d{4}-\d{2}&pesan=disimpan/);
  await expect(page.getByRole("link", { name: new RegExp(String(kode)) }).first()).toBeVisible();

  await buka(page, "/keuangan/baru");
  await expect(pilihan(page, "Tutor yang dibayar")).toHaveCount(0);
  await pilihan(page, "Kategori").selectOption({ label: "Honor Tutor" });
  await expect(pilihan(page, "Tutor yang dibayar")).toBeVisible();
  await pilihan(page, "Tutor yang dibayar").selectOption({ label: "Ustadz Fulan" });
  await page.getByLabel("Jumlah (Rp)").fill("25000");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/pesan=disimpan/);

  await buka(page, "/honor");
  await expect(barisFulan.locator('[data-kolom="dibayar"]')).toHaveText(new RegExp((dibayarAwal + 25000).toLocaleString("id-ID")));

  // catatan yang akan dihapus (soft delete)
  await buka(page, "/keuangan/baru");
  await pilihan(page, "Kategori").selectOption({ label: "Operasional" });
  await page.getByLabel("Jumlah (Rp)").fill("12345");
  await isian(page, "Keterangan (opsional)").fill(ketHapus);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/pesan=disimpan/);
  await page.getByRole("link", { name: new RegExp(ketHapus) }).click();
  await expect(page).toHaveURL(/\/keuangan\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Hapus" }).click();
  await expect(page).toHaveURL(/pesan=dihapus/);
  await expect(page.getByRole("link", { name: new RegExp(ketHapus) })).toHaveCount(0);
});

test("ekspor CSV kas: sel formula dinetralkan dan baris terhapus tidak ikut", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  const bulan = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit" }).format(new Date());
  const res = await page.request.get(`/ekspor/kas?bulan=${bulan}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(res.headers()["content-disposition"]).toContain(`kas-${bulan}.csv`);
  const csv = await res.text();
  expect(csv.startsWith("﻿Tanggal,Jenis,Kategori,Tutor,Keterangan,Jumlah (Rp)")).toBe(true);
  expect(csv).toContain(`"'=HYPERLINK(""http://jahat.example"",""klik"") ${kode}"`);
  expect(csv).not.toMatch(/(^|,)=HYPERLINK/m);
  expect(csv).not.toContain(ketHapus);
});

test("admin mencatat pembayaran Belum Lunas lalu menandai Lunas; ekspor pembayaran", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, "/pembayaran/baru");
  await pilihan(page, "Peserta").selectOption({ label: "Peserta Satu" });
  await isian(page, "Keterangan (mis. SPP Oktober, Infaq)").fill(ketSpp);
  await page.getByLabel("Jumlah (Rp)").fill("150000");
  await pilihan(page, "Status").selectOption("belum_lunas");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/pembayaran\?bulan=.*pesan=disimpan/);

  const baris = page.getByRole("link", { name: new RegExp(ketSpp) });
  await expect(baris).toContainText("Belum Lunas");
  await buka(page, "/pembayaran?status=lunas&q=" + encodeURIComponent(ketSpp));
  await expect(page.getByText("Tidak ada pembayaran yang cocok.")).toBeVisible();

  await buka(page, "/pembayaran?q=" + encodeURIComponent(ketSpp));
  await baris.click();
  await expect(page).toHaveURL(/\/pembayaran\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  await pilihan(page, "Status").selectOption("lunas");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Perubahan tersimpan." })).toBeVisible();

  const bulan = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit" }).format(new Date());
  const csv = await (await page.request.get(`/ekspor/pembayaran?bulan=${bulan}`)).text();
  expect(csv).toContain(`Peserta Satu,${ketSpp},150000,Lunas`);
});

test("admin menambah dan menonaktifkan kategori kas", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, "/keuangan/kategori");
  const nama = `Sewa ${kode}`;
  await isian(page, "Nama kategori").fill(nama);
  await page.getByRole("button", { name: "Tambah kategori" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ditambahkan" })).toBeVisible();
  await page.getByRole("button", { name: `Nonaktifkan kategori ${nama}` }).click();
  await expect(page.getByRole("button", { name: `Aktifkan kategori ${nama}` })).toBeVisible();

  await buka(page, "/keuangan/baru");
  await expect(pilihan(page, "Kategori").locator("option", { hasText: nama })).toHaveCount(0);
});

test("rekap bulanan dan dashboard admin menampilkan data keuangan", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await expect(page.getByRole("heading", { name: "Kas 6 bulan terakhir" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Pemasukan dan pengeluaran per bulan" })).toBeVisible();
  await buka(page, "/keuangan/rekap");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Total" })).toBeVisible();
  const csv = await (await page.request.get("/ekspor/honor")).text();
  expect(csv.startsWith("﻿Bulan,Tutor,Jumlah sesi,Honor sesi (Rp),Honor dibayar (Rp)")).toBe(true);
});

test("tutor tidak bisa membuka halaman dan ekspor keuangan", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  for (const jalur of ["/keuangan", "/keuangan/baru", "/keuangan/rekap", "/keuangan/kategori", "/pembayaran", "/pembayaran/baru"]) {
    await page.goto(jalur);
    await expect(page).toHaveURL(/\/tidak-berwenang$/);
  }
  for (const jalur of ["/ekspor/kas", "/ekspor/pembayaran", "/ekspor/honor"]) {
    const res = await page.request.get(jalur);
    expect(res.url()).toMatch(/\/tidak-berwenang$/);
    expect(await res.text()).not.toContain("Jumlah (Rp)");
  }
});
