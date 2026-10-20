import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LEBAR = [360, 390, 768, 1024, 1440];

test("landing page tampil dengan isi brosur, dan tombol Masuk menuju dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Program\s+Miftah\s+al-Lughah/i);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Pilih kelas Anda",
    "Kurikulum & sistem pembelajaran",
    "Tiga langkah, langsung belajar",
    "Mulai dari sekarang, menuju kemahiran berbahasa Arab!",
  ]);
  await expect(page.getByRole("heading", { level: 3 })).toHaveText([
    "Reguler",
    "Semi Privat",
    "Privat",
    "4 Maharah yang diujikan",
    "Fasilitas",
    "Daftar",
    "Terima jadwal & tautan",
    "Belajar bersama pengajar",
  ]);

  // Harga dari lib/site-content.ts, diformat rupiah; satuan dan catatan persis brosur
  const kartu = page.locator("#program article");
  await expect(kartu.nth(0)).toContainText(/Rp\s100\.000\s*\/peserta\/bulan/);
  await expect(kartu.nth(1)).toContainText(/Rp\s175\.000\s*\/peserta\/bulan/);
  await expect(kartu.nth(2)).toContainText(/Rp\s275\.000\s*\/bulan \(Per Tingkat\)/);
  await expect(page.getByText("*Harga untuk 1 tingkat")).toBeVisible();

  // WhatsApp lembaga terisi: semua tombol daftar membuka wa.me dengan aman
  await expect(page.getByText("+62 878-6355-4350")).toBeVisible();
  await expect(page.getByText("[NOMOR WHATSAPP]")).toHaveCount(0);
  const tautanWa = page.locator('a[href^="https://wa.me/"]');
  await expect(tautanWa).toHaveCount(3);
  for (const a of await tautanWa.all()) {
    await expect(a).toHaveAttribute("href", /^https:\/\/wa\.me\/6287863554350\?text=Assalamu/);
    await expect(a).toHaveAttribute("target", "_blank");
    await expect(a).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(page.locator("#daftar").getByRole("link", { name: "Daftar Sekarang" })).not.toHaveAttribute("aria-disabled", "true");
  // Teks tombol harus terlihat: warna teks berbeda dari latar
  const warna = await page
    .locator("#daftar")
    .getByRole("link", { name: "Daftar Sekarang" })
    .evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]);
  expect(warna[0]).not.toBe(warna[1]);

  // Placeholder selama kontak lain dan jadwal belum diisi
  // Kolom Instagram dan alamat dihapus atas permintaan pemilik (2026-10-19)
  await expect(page.locator("#daftar")).not.toContainText(/Instagram|Alamat/);
  await expect(page.getByText("[HARI & JAM]")).toHaveCount(3);

  // Empat maharah: teks Arab benar dan kanan-ke-kiri
  for (const arab of ["الاستماع", "الكلام", "القراءة", "الكتابة"]) {
    const el = page.getByText(arab, { exact: true });
    await expect(el).toHaveAttribute("dir", "rtl");
    await expect(el).toHaveAttribute("lang", "ar");
  }
  // Baris "Pendampingan" di brosur kosong, jadi tidak ditampilkan
  await expect(page.locator("#kurikulum dt")).toHaveText(["Materi", "Pertemuan", "Durasi", "Ujian"]);

  // Hanya Program Bahasa Arab: tanpa Inggris/Nahwu di teks, judul, deskripsi, maupun pita
  const semuaTeks = await page.evaluate(
    () =>
      `${document.body.textContent} ${document.title} ${document.querySelector('meta[name="description"]')?.getAttribute("content")}`,
  );
  expect(semuaTeks).not.toMatch(/inggris|english|nahwu|نحو/i);
  expect(semuaTeks).not.toMatch(/portal belajar/i);

  // Tidak ada formulir di landing page
  await expect(page.locator("form")).toHaveCount(0);

  // Dashboard adalah situs terpisah: "Masuk" hanya tautan ke halaman masuknya
  for (const masuk of [
    page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Masuk" }),
    page.getByRole("link", { name: "Masuk (admin dan tutor)" }),
  ]) {
    await expect(masuk).toHaveAttribute("href", /^https?:\/\/[^/]+\/masuk$/);
  }
});

test("aksesibilitas (axe WCAG AA) dan tanpa galat konsol/CSP", async ({ page }) => {
  const galat: string[] = [];
  page.on("console", (m) => m.type() === "error" && galat.push(m.text()));
  page.on("pageerror", (e) => galat.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const hasil = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const berat = hasil.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}x) ${v.nodes[0]?.target.join(" ")}`);
  expect(berat).toEqual([]);
  expect(galat.filter((g) => !g.includes("favicon"))).toEqual([]);
});

test("landing page hanya memuat sumber dari domain sendiri (font di-host sendiri)", async ({ page }) => {
  const asal = new URL(test.info().project.use.baseURL ?? "http://localhost:3000").origin;
  const luar: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(asal)) luar.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(luar).toEqual([]);
  const font = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
  expect(font).toMatch(/Bricolage/i);
});

for (const lebar of LEBAR) {
  test(`tanpa geser horizontal di ${lebar}px`, async ({ page }) => {
    await page.setViewportSize({ width: lebar, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const lebih = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(lebih).toBeLessThanOrEqual(0);
  });
}

test("boleh diindeks mesin pencari, dengan header keamanan", async ({ request }) => {
  const beranda = await request.get("/");
  const h = beranda.headers();
  expect(h["x-robots-tag"]).toBeUndefined();
  expect(await beranda.text()).toContain('rel="canonical"');
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toMatch(/Allow: \/[\s\S]*Sitemap: .*\/sitemap\.xml/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
});

test("gerak 3D berjalan dan mengikuti kursor", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(10);

  const adegan = page.locator(".lp-adegan");
  const kotak = (await adegan.boundingBox())!;
  await page.mouse.move(kotak.x + kotak.width * 0.9, kotak.y + kotak.height * 0.1, { steps: 5 });
  await expect.poll(() => adegan.evaluate((e) => e.style.getPropertyValue("--ry"))).not.toBe("");
  await page.mouse.move(0, 0);
  await expect.poll(() => adegan.evaluate((e) => e.style.getPropertyValue("--ry"))).toBe("");
});

test.describe("kurangi gerakan", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("semua animasi mati bila pengguna memilih kurangi gerakan", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe("menu ponsel (sidebar)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("header satu baris: logo + tombol ☰; sidebar buka, Esc dan pilih tautan menutup", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const menuPil = page.getByRole("navigation", { name: "Navigasi utama" });
    const tombol = page.getByRole("button", { name: "Buka menu" });
    await expect(menuPil).toBeHidden();
    await expect(tombol).toBeVisible();

    // Logo dan tombol sejajar dalam satu baris
    const logo = (await page.locator(".lp-nav > .lp-logo").boundingBox())!;
    const kotakTombol = (await tombol.boundingBox())!;
    expect(Math.abs(logo.y + logo.height / 2 - (kotakTombol.y + kotakTombol.height / 2))).toBeLessThan(6);
    await expect(page.locator(".lp-nav > .lp-logo img")).toHaveAttribute("src", /logo-tanda/);

    const sidebar = page.getByRole("dialog", { name: "Menu" });
    await expect(sidebar).toBeHidden();
    await tombol.click();
    await expect(sidebar).toBeVisible();
    await expect(tombol).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar.getByRole("link")).toHaveText(["Program", "Kurikulum", "Cara belajar", "Daftar", "Masuk"]);
    await expect(sidebar.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", /\/masuk$/);
    await expect(sidebar.getByRole("link", { name: "Program" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
    await expect(tombol).toBeFocused();

    await tombol.click();
    await sidebar.getByRole("link", { name: "Kurikulum" }).click();
    await expect(sidebar).toBeHidden();
    await expect(page).toHaveURL(/#kurikulum$/);
    await expect(page.locator("#kurikulum")).toBeInViewport();
  });

  test("ketuk latar menutup sidebar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();
    const sidebar = page.getByRole("dialog", { name: "Menu" });
    await expect(sidebar).toBeVisible();
    await page.mouse.click(20, 400);
    await expect(sidebar).toBeHidden();
  });
});

test("di desktop menu pil tampil dan tombol ☰ tersembunyi", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buka menu" })).toBeHidden();
});
