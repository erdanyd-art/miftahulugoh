import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql
const ZONA = "Asia/Makassar"; // zona lembaga di seed (pengaturan)
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

function hariIni() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  const iso = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday) + 1;
  const tanggal = `${p.year}-${p.month}-${p.day}`;
  const kemarin = new Date(Date.parse(`${tanggal}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return { namaHari: HARI[iso - 1], tanggal, kemarin };
}

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
const status = (page: Page) => page.locator("form [role=status]");

test.describe.configure({ mode: "serial" });

const kode = Date.now();
const namaKelas = `Kelas Absen ${kode}`;
const pesertaA = `Murid A ${kode}`;
const pesertaB = `Murid B ${kode}`;
let jadwalId = "";

test("admin menyiapkan kelas, dua peserta, dan jadwal hari ini", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  for (const nama of [pesertaA, pesertaB]) {
    await buka(page, "/peserta/baru");
    await page.getByRole("textbox", { name: "Nama peserta", exact: true }).fill(nama);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/pesan=disimpan/);
  }
  await buka(page, "/kelas/baru");
  await page.getByRole("textbox", { name: "Nama kelas (sudah mewakili mata pelajaran)" }).fill(namaKelas);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/pesan=disimpan/);
  await page.waitForLoadState("networkidle");
  for (const nama of [pesertaA, pesertaB]) {
    await pilihan(page, "Tambah peserta").selectOption({ label: nama });
    await page.getByRole("button", { name: "Tambahkan" }).click();
    await expect(page.getByRole("link", { name: nama })).toBeVisible();
  }

  await buka(page, "/jadwal/baru");
  await pilihan(page, "Kelas").selectOption({ label: namaKelas });
  await pilihan(page, "Tutor").selectOption({ label: "Ustadz Fulan" });
  await pilihan(page, "Hari").selectOption({ label: hariIni().namaHari });
  await page.getByLabel("Honor per sesi (Rp)").fill("100001");
  await page.getByLabel("Jam mulai").fill("00:00");
  await page.getByLabel("Jam selesai").fill("23:59");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/jadwal\/[0-9a-f-]+\?pesan=disimpan/);
  jadwalId = new URL(page.url()).pathname.split("/")[2];
});

test("tutor absen dari dashboard: hadir 1 -> honor penuh; simpan ulang hadir 0 -> setengah dibulatkan ke bawah", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  const baris = page.getByRole("listitem").filter({ hasText: namaKelas });
  await expect(baris.getByText("Belum absen")).toBeVisible();
  await baris.getByRole("link", { name: "Absen" }).click();
  await expect(page.getByRole("heading", { name: `Absensi ${namaKelas}` })).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.getByRole("checkbox", { name: new RegExp(pesertaA) }).check();
  await expect(page.getByText("Hadir 1 dari 2")).toBeVisible();
  await page.getByRole("button", { name: "Simpan absensi" }).click();
  await expect(status(page)).toHaveText("Absensi tersimpan: hadir 1 dari 2. Honor sesi Rp 100.001.");

  await page.getByRole("button", { name: "Kosongkan" }).click();
  await page.getByRole("button", { name: "Simpan absensi" }).click();
  await expect(status(page)).toHaveText("Absensi tersimpan: hadir 0 dari 2. Honor sesi Rp 50.000.");

  await buka(page, "/");
  await expect(baris.getByText("Sudah absen · hadir 0/2")).toBeVisible();
  await expect(baris.getByRole("link", { name: "Ubah absen" })).toBeVisible();
});

test("tutor tidak bisa memilih tanggal lain dan tutor lain tidak bisa membuka jadwal itu", async ({ page, browser }) => {
  await masuk(page, "tutor1@contoh.test");
  await buka(page, `/absensi/isi/${jadwalId}?tanggal=${hariIni().kemarin}`);
  await expect(page.getByLabel("Tanggal sesi (koreksi admin)")).toHaveCount(0);
  await expect(page.getByText("Hadir 0 dari 2")).toBeVisible(); // tetap sesi hari ini

  const lain = await (await browser.newContext()).newPage();
  await masuk(lain, "tutor2@contoh.test");
  await buka(lain, `/absensi/isi/${jadwalId}`);
  await expect(lain.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});

test("admin mengoreksi honor dan mengunci sesi; tutor tidak bisa mengubah", async ({ page, browser }) => {
  await masuk(page, "admin@contoh.test");
  const baris = page.getByRole("listitem").filter({ hasText: namaKelas });
  await expect(baris.getByText("Sudah absen · hadir 0/2")).toBeVisible();

  await buka(page, `/absensi?kelas=`);
  await page.getByRole("link", { name: new RegExp(namaKelas) }).first().click();
  await expect(page.getByRole("heading", { name: namaKelas })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Honor sesi (Rp)").fill("77777");
  await page.getByRole("button", { name: "Koreksi honor" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Honor dikoreksi menjadi Rp 77.777" })).toBeVisible();
  await page.getByRole("button", { name: "Kunci sesi" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sesi dikunci" })).toBeVisible();

  const tutor = await (await browser.newContext()).newPage();
  await masuk(tutor, "tutor1@contoh.test");
  await expect(tutor.getByRole("listitem").filter({ hasText: namaKelas }).getByText(/Terkunci/)).toBeVisible();
  await buka(tutor, `/absensi/isi/${jadwalId}`);
  await expect(tutor.getByText("Sesi ini dikunci admin dan tidak bisa diubah.")).toBeVisible();
  await expect(tutor.getByRole("button", { name: "Simpan absensi" })).toHaveCount(0);

  await buka(tutor, "/honor-saya");
  const riwayat = tutor.getByRole("link", { name: new RegExp(namaKelas) });
  await expect(riwayat).toContainText("Rp 77.777");
  await expect(riwayat).toContainText("Dikoreksi");

  // buka kunci; tutor menyimpan ulang -> koreksi admin tidak tertimpa
  await page.getByRole("button", { name: "Buka kunci sesi" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Kunci sesi dibuka" })).toBeVisible();
  await buka(tutor, `/absensi/isi/${jadwalId}`);
  await tutor.getByRole("checkbox", { name: new RegExp(pesertaB) }).check();
  await tutor.getByRole("button", { name: "Simpan absensi" }).click();
  await expect(status(tutor)).toHaveText("Absensi tersimpan: hadir 1 dari 2. Honor sesi Rp 77.777.");
});

test("admin mengisi absensi tanggal lampau (koreksi)", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await buka(page, `/absensi/isi/${jadwalId}?tanggal=${hariIni().kemarin}`);
  await expect(page.getByLabel("Tanggal sesi (koreksi admin)")).toHaveValue(hariIni().kemarin);
  await page.getByRole("checkbox", { name: new RegExp(pesertaA) }).check();
  await page.getByRole("button", { name: "Simpan absensi" }).click();
  await expect(status(page)).toHaveText("Absensi tersimpan: hadir 1 dari 2. Honor sesi Rp 100.001.");
});

test("tutor tidak bisa membuka halaman Honor admin", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  await page.goto("/honor");
  await expect(page).toHaveURL(/\/tidak-berwenang$/);
});
