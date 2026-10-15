import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql
const MAILPIT = "http://127.0.0.1:54324/api/v1";

async function masuk(page: Page, email: string, sandi = SANDI) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

// Ambil tautan dari email terbaru untuk alamat tertentu di Mailpit (server email lokal).
async function tautanEmail(request: APIRequestContext, ke: string): Promise<string> {
  let tautan = "";
  await expect(async () => {
    const hasil = await (await request.get(`${MAILPIT}/search?query=${encodeURIComponent(`to:"${ke}"`)}`)).json();
    expect(hasil.messages.length).toBeGreaterThan(0);
    const pesan = await (await request.get(`${MAILPIT}/message/${hasil.messages[0].ID}`)).json();
    tautan = (pesan.HTML as string).match(/href="([^"]+)"/)![1].replaceAll("&amp;", "&");
  }).toPass({ timeout: 15_000 });
  return tautan;
}

test.describe.configure({ mode: "serial" });

test("admin menambah tutor; tutor membuat sandi; nonaktif memutus akses; aktif lagi memulihkan", async ({
  browser,
  request,
}) => {
  const email = `tutor-uji-${Date.now()}@contoh.test`;
  const nama = `Tutor Uji ${Date.now()}`;
  const sandiBaru = "sandi-tutor-uji-123";

  const admin = await (await browser.newContext()).newPage();
  await masuk(admin, "admin@contoh.test");
  await admin.goto("/pengguna/baru");
  await admin.getByRole("textbox", { name: "Nama", exact: true }).fill(nama);
  await admin.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await admin.getByRole("combobox", { name: "Peran" }).selectOption("tutor");
  await admin.getByRole("button", { name: "Tambah dan kirim undangan" }).click();
  await expect(admin).toHaveURL(/\/pengguna\?pesan=ditambah/);
  await expect(admin.getByRole("status")).toContainText("undangan sudah dikirim");

  // Tutor membuka tautan undangan dari email dan membuat kata sandi sendiri.
  const tutor = await (await browser.newContext()).newPage();
  await tutor.goto(await tautanEmail(request, email));
  await expect(tutor).toHaveURL(/\/atur-sandi$/);
  await tutor.getByLabel(/Kata sandi baru/).fill(sandiBaru);
  await tutor.getByLabel("Ulangi kata sandi").fill(sandiBaru);
  await tutor.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(tutor).toHaveURL(/\/$/);
  await expect(tutor.getByText(nama)).toBeVisible();

  // Admin menonaktifkan tutor yang sedang login.
  await admin.goto(`/pengguna?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: new RegExp(nama) }).click();
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Nonaktifkan akun" }).click();
  await expect(admin.getByRole("status")).toContainText("Akun dinonaktifkan");
  await expect(admin.getByRole("button", { name: "Aktifkan akun" })).toBeVisible();

  // Sesi tutor yang sedang berjalan langsung kehilangan akses.
  await tutor.goto("/jadwal-saya");
  await expect(tutor).toHaveURL(/\/(akun-tidak-aktif|masuk)$/);
  await tutor.context().clearCookies();
  await tutor.goto("/masuk");
  await tutor.getByLabel("Email").fill(email);
  await tutor.getByLabel("Kata sandi", { exact: true }).fill(sandiBaru);
  await tutor.getByRole("button", { name: "Masuk" }).click();
  await expect(tutor.locator("form [role=alert]")).toBeVisible();
  await expect(tutor).toHaveURL(/\/masuk/);

  // Diaktifkan lagi: tutor bisa masuk kembali.
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Aktifkan akun" }).click();
  await expect(admin.getByRole("status")).toContainText("Akun diaktifkan");
  await masuk(tutor, email, sandiBaru);
  await expect(tutor.getByText(nama)).toBeVisible();

  // Admin mengirim tautan atur ulang; tautan (template recovery, token_hash) membuka /atur-sandi.
  await request.delete(`${MAILPIT}/messages`);
  await admin.getByRole("button", { name: "Kirim tautan buat kata sandi" }).click();
  await expect(admin.getByRole("status").first()).toContainText(`dikirim ke ${email}`);
  const tutorLain = await (await browser.newContext()).newPage();
  await tutorLain.goto(await tautanEmail(request, email));
  await expect(tutorLain).toHaveURL(/\/atur-sandi$/);
});

test("admin mengubah nama pengguna dan tidak bisa menonaktifkan diri sendiri", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/pengguna?q=admin%40contoh.test");
  await page.getByRole("link", { name: /Admin Contoh/ }).click();
  await expect(page.getByRole("heading", { name: "Admin Contoh" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kirim tautan buat kata sandi" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nonaktifkan akun" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Peran" })).toHaveCount(0);

  await page.goto("/pengguna?q=tutor2%40contoh.test");
  await page.getByRole("link", { name: /Ustadzah Fulanah/ }).click();
  await expect(page.getByRole("heading", { name: "Ustadzah Fulanah", exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle"); // tunggu halaman selesai di-stream sebelum mengisi form
  await page.getByRole("textbox", { name: "Nama", exact: true }).fill("Ustadzah Fulanah Edit");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
  await expect(page.getByRole("heading", { name: "Ustadzah Fulanah Edit" })).toBeVisible();
  await page.getByRole("textbox", { name: "Nama", exact: true }).fill("Ustadzah Fulanah");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ustadzah Fulanah", exact: true })).toBeVisible();
});

test("tutor yang mengajar tidak bisa dijadikan admin", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/pengguna?q=tutor1%40contoh.test");
  await page.getByRole("link", { name: /Ustadz Fulan/ }).click();
  await expect(page.getByRole("heading", { name: "Ustadz Fulan" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox", { name: "Peran" }).selectOption("admin");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.locator("form [role=alert]")).toContainText("masih tercatat sebagai tutor di jadwal");
});

test("cari dan filter daftar pengguna", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/pengguna");
  await page.getByLabel("Cari nama atau email").fill("fulan");
  await page.getByRole("button", { name: "Terapkan" }).click();
  await expect(page).toHaveURL(/q=fulan/);
  await expect(page.getByRole("link", { name: /Ustadz Fulan/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Admin Contoh/ })).toHaveCount(0);

  await page.goto("/pengguna?status=nonaktif");
  await expect(page.getByRole("link", { name: /Tutor Nonaktif/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Admin Contoh/ })).toHaveCount(0);
});

test("admin menyimpan zona waktu lembaga", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await page.goto("/pengaturan");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Zona waktu lembaga").selectOption("Asia/Jakarta");
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByRole("status")).toHaveText("Pengaturan tersimpan.");
  await page.reload();
  await expect(page.getByLabel("Zona waktu lembaga")).toHaveValue("Asia/Jakarta");
  await page.getByLabel("Zona waktu lembaga").selectOption("Asia/Makassar");
  await page.getByRole("button", { name: "Simpan pengaturan" }).click();
  await expect(page.getByRole("status")).toHaveText("Pengaturan tersimpan.");
});

test("tutor tidak bisa membuka halaman Pengguna dan Pengaturan", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  for (const jalur of ["/pengguna", "/pengguna/baru", "/pengaturan"]) {
    await page.goto(jalur);
    await expect(page).toHaveURL(/\/tidak-berwenang$/);
  }
});
