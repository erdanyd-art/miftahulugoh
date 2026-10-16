import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string, sandi = SANDI) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

async function gantiSandi(page: Page, lama: string, baru: string) {
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Kata sandi lama", { exact: true }).fill(lama);
  await page.getByLabel(/^Kata sandi baru/).fill(baru);
  await page.getByLabel("Ulangi kata sandi baru", { exact: true }).fill(baru);
  await page.getByRole("button", { name: "Ganti kata sandi" }).click();
}

const menu = (page: Page) => page.getByRole("navigation", { name: "Menu utama" }).first();

test("admin membuat akun peserta; peserta masuk dengan username, wajib ganti sandi awal; admin mengatur ulang", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  const kode = Date.now().toString(36);
  const nama = `Murid E2E ${kode}`;
  const username = `murid.${kode}`;

  await masuk(page, "admin@contoh.test");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/peserta/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Nama peserta" }).fill(nama);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/peserta\/[0-9a-f-]+\?pesan=disimpan/);
  const halamanPeserta = page.url().split("?")[0];
  await page.waitForLoadState("networkidle");

  // Username tidak valid ditolak; username valid membuat akun dan menampilkan sandi awal sekali
  await page.getByRole("textbox", { name: "Username" }).fill("ab!");
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Username 3–30 karakter" })).toBeVisible();
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("button", { name: "Buat akun" }).click();
  const kotak = page.getByRole("status").filter({ hasText: "hanya tampil sekali" });
  await expect(kotak).toContainText(username);
  const sandiAwal = (await kotak.locator("dd").nth(1).textContent())!.trim();
  expect(sandiAwal).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
  await page.getByRole("button", { name: "Selesai, sudah saya catat" }).click();
  await expect(page.getByText("Belum ganti sandi awal")).toBeVisible();

  // Username yang sama tidak bisa dipakai peserta lain
  await page.goto("/peserta/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Nama peserta" }).fill(`${nama} kembar`);
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "sudah dipakai" })).toBeVisible();

  // Peserta masuk (konteks terpisah): diarahkan wajib ganti sandi sebelum bisa membuka apa pun
  const ctx = await browser.newContext();
  const murid = await ctx.newPage();
  await masuk(murid, username.toUpperCase(), sandiAwal); // username tidak peka huruf besar
  await expect(murid).toHaveURL(/\/ganti-sandi$/);
  await murid.goto("/akun");
  await expect(murid).toHaveURL(/\/ganti-sandi$/);
  const sandiBaru = `sandi-murid-${kode}`;
  await gantiSandi(murid, sandiAwal, sandiBaru);
  await expect(murid).toHaveURL(/\/$/);
  await expect(murid.getByRole("heading", { name: `Assalamu'alaikum, ${nama}` })).toBeVisible();
  await ctx.close();

  // Admin melihat sandi awal sudah diganti, lalu mengatur ulang
  await page.goto(halamanPeserta);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Belum ganti sandi awal")).toHaveCount(0);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Atur ulang kata sandi" }).click();
  const kotakBaru = page.getByRole("status").filter({ hasText: "hanya tampil sekali" });
  await expect(kotakBaru).toContainText(username);
  const sandiReset = (await kotakBaru.locator("dd").nth(1).textContent())!.trim();

  const ctx2 = await browser.newContext();
  const murid2 = await ctx2.newPage();
  await masuk(murid2, username, sandiBaru);
  await expect(murid2.locator("form [role=alert]")).toHaveText("Email/username atau kata sandi salah.");
  await masuk(murid2, username, sandiReset);
  await expect(murid2).toHaveURL(/\/ganti-sandi$/);
  await ctx2.close();
});

test("peserta hanya melihat menu peserta dan ditolak di halaman staf", async ({ page }) => {
  await masuk(page, "murid.contoh");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Assalamu'alaikum, Peserta Lima" })).toBeVisible();
  await expect(menu(page).getByRole("link", { name: "Akun saya" })).toBeAttached();
  await expect(menu(page).getByRole("link", { name: "Absensi" })).toHaveCount(0);
  for (const jalur of ["/absensi", "/jadwal-saya", "/kelas-saya", "/honor-saya", "/peserta", "/keuangan", "/pengguna"]) {
    await page.goto(jalur);
    await expect(page, jalur).toHaveURL(/\/tidak-berwenang$/);
  }
  for (const jalur of ["/ekspor/kas", "/ekspor/pembayaran", "/ekspor/honor"]) {
    const res = await page.request.get(jalur);
    expect(res.url()).toMatch(/\/tidak-berwenang$/);
    expect(await res.text()).not.toContain("Jumlah (Rp)");
  }
});

test("akun peserta tidak muncul di menu Pengguna", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/pengguna?q=peserta.miftah.invalid");
  await expect(page.getByRole("main").getByRole("link", { name: /Peserta Lima/ })).toHaveCount(0);
});
