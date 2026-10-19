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
  await expect(pesanGalat(page)).toHaveText("Email/username atau kata sandi salah.");
  await expect(page.getByLabel("Email")).toHaveValue("admin@contoh.test");
});

test("email tak terdaftar memberi pesan yang sama", async ({ page }) => {
  await masuk(page, "tidak-ada@contoh.test");
  await expect(pesanGalat(page)).toHaveText("Email/username atau kata sandi salah.");
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
  // Setelah keluar, "/" menampilkan landing page publik, bukan dashboard.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("kunci");
  await page.goto("/keuangan");
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("kunci");
  await page.goto("/absensi");
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

test("tombol lihat/sembunyikan kata sandi", async ({ page }) => {
  await page.goto("/masuk");
  const sandi = page.getByLabel("Kata sandi", { exact: true });
  await sandi.fill("rahasia-123");
  await expect(sandi).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(sandi).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan kata sandi" }).click();
  await expect(sandi).toHaveAttribute("type", "password");
});

test("pengguna mengganti kata sandi sendiri dari halaman Akun saya", async ({ page }) => {
  const baru = "sandi-baru-uji-456";
  const ganti = async (lama: string, sandiBaru: string) => {
    await page.goto("/akun");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Kata sandi lama", { exact: true }).fill(lama);
    await page.getByLabel(/^Kata sandi baru/).fill(sandiBaru);
    await page.getByLabel("Ulangi kata sandi baru", { exact: true }).fill(sandiBaru);
    await page.getByRole("button", { name: "Ganti kata sandi" }).click();
  };

  await masuk(page, "tutor2@contoh.test");
  await page.getByRole("link", { name: /Akun saya/ }).first().click();
  await expect(page.getByRole("heading", { name: "Akun saya" })).toBeVisible();

  await ganti("salah-sekali-123", baru);
  await expect(pesanGalat(page)).toHaveText("Kata sandi lama salah.");

  await ganti(SANDI, baru);
  await expect(page.getByText("Kata sandi berhasil diganti")).toBeVisible();

  // Kembalikan ke sandi seed agar tes lain tetap jalan; sekaligus membuktikan sandi baru berlaku.
  await ganti(baru, SANDI);
  await expect(page.getByText("Kata sandi berhasil diganti")).toBeVisible();
});

test("keluar saat server lambat: pop-up 'Sedang keluar...' tampil, lalu kembali ke halaman masuk", async ({ page }) => {
  await masuk(page, "admin@contoh.test");
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");
  // Perlambat permintaan server action (POST) agar status loading terlihat
  await page.route("**/*", async (route) => {
    if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sedang keluar..." })).toBeVisible();
  await expect(page).toHaveURL(/\/masuk$/);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.goto("/keuangan");
  await expect(page).toHaveURL(/\/masuk$/);
});
