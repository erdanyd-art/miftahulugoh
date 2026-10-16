import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

// Nilai <input type="datetime-local"> di zona lembaga (seed: Asia/Makassar).
function lokal(selisihMenit: number) {
  const b = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(Date.now() + selisihMenit * 60_000))
      .map((p) => [p.type, p.value]),
  );
  return `${b.year}-${b.month}-${b.day}T${b.hour}:${b.minute}`;
}

test("peserta mengerjakan ujian: mulai, jawab (tersimpan otomatis), muat ulang, selesai; admin melihat hasilnya", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const judul = `Kuis Dengar ${Date.now().toString(36)}`;

  // ===== admin menyiapkan ujian yang sedang dibuka untuk kelas murid.contoh (Bahasa Inggris) =====
  await masuk(page, "admin@contoh.test");
  await page.goto("/ujian/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(judul);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Inggris" });
  await page.getByLabel("Dibuka mulai").fill(lokal(-60));
  await page.getByLabel("Ditutup pada").fill(lokal(120));
  await page.getByRole("spinbutton", { name: "Durasi pengerjaan (menit)" }).fill("30");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/ujian\/[0-9a-f-]+\?pesan=disimpan/);
  const halamanAdmin = page.url().split("?")[0];
  await page.waitForLoadState("networkidle");

  await page.getByRole("textbox", { name: "Judul audio" }).fill("Dialog");
  await page.getByLabel("Berkas (MP3/M4A, maks. 10 MB)").setInputFiles({
    name: "dialog.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("ID3 berkas uji"),
  });
  await page.getByRole("button", { name: "Unggah audio" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Audio diunggah." })).toBeVisible();

  await page.goto(`${halamanAdmin}/soal/baru`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Where is Ahmad going?");
  await page.getByRole("textbox", { name: "Pilihan A" }).fill("To the market");
  await page.getByRole("textbox", { name: "Pilihan B" }).fill("To school");
  await page.getByRole("radio", { name: "Kunci: pilihan B" }).check();
  await page.getByRole("combobox", { name: "Audio (opsional)" }).selectOption({ label: "Dialog" });
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);

  await page.goto(`${halamanAdmin}/soal/baru`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox", { name: "Jenis soal" }).selectOption("isian");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Translate: كِتَابٌ");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ujian diterbitkan" })).toBeVisible();

  // ===== peserta =====
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const murid = await ctx.newPage();
  const galatKonsol: string[] = [];
  murid.on("console", (m) => m.type() === "error" && galatKonsol.push(m.text()));
  await masuk(murid, "murid.contoh");
  const kartu = murid.getByRole("link", { name: new RegExp(judul) });
  await expect(kartu).toContainText("Bisa dikerjakan");
  await kartu.click();
  await murid.waitForLoadState("networkidle");
  await expect(murid.getByText("Kesempatan hanya satu kali.")).toBeVisible();
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Mulai ujian" }).click();

  const timer = murid.getByRole("timer", { name: "Sisa waktu" });
  await expect(timer).toHaveText(/^(29|30):\d\d$/);
  await expect(murid.getByText("Where is Ahmad going?")).toBeVisible();
  await expect(murid.locator("audio")).toHaveCount(1);
  await murid.getByRole("radio", { name: /To school/ }).check();
  await expect(murid.getByText("Semua jawaban tersimpan · 1/2 terjawab")).toBeVisible();
  await murid.getByRole("button", { name: "Berikutnya" }).click();
  await expect(murid.getByText("Translate: كِتَابٌ")).toBeVisible();
  await murid.getByRole("textbox", { name: "Jawaban Anda" }).fill("a book");
  await expect(murid.getByText("Semua jawaban tersimpan · 2/2 terjawab")).toBeVisible();

  // Muat ulang: jawaban dan sisa waktu dari server tetap
  await murid.reload();
  await murid.waitForLoadState("networkidle");
  await expect(murid.getByText("2/2 terjawab")).toBeVisible();
  await expect(murid.getByRole("radio", { name: /To school/ })).toBeChecked();
  await murid.getByRole("button", { name: /Soal 2/ }).click();
  await expect(murid.getByRole("textbox", { name: "Jawaban Anda" })).toHaveValue("a book");
  await expect(timer).toHaveText(/^(29|30):\d\d$/);

  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Selesai dan kumpulkan" }).click();
  await expect(murid.getByText("Ujian selesai dan jawaban Anda sudah tersimpan.")).toBeVisible();
  await murid.goto("/");
  await expect(murid.getByRole("link", { name: new RegExp(judul) })).toContainText("Selesai");
  expect(galatKonsol.filter((g) => !g.includes("favicon")), "galat konsol (termasuk CSP)").toEqual([]);
  await ctx.close();

  // ===== admin: jumlah peserta, soal terkunci, ujian tidak bisa dihapus =====
  await page.goto(halamanAdmin);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Peserta mulai: 1 · selesai: 1")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Hapus ujian" }).click();
  await expect(page.locator("form [role=alert]:visible")).toContainText("sudah dikerjakan peserta");
  await page.getByRole("link", { name: "Ubah" }).first().click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Diubah setelah dikerjakan");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page.locator("form [role=alert]:visible")).toContainText("sudah ada peserta yang mulai");
});

test("waktu habis: ujian otomatis selesai, jawaban terakhir tetap tersimpan", async ({ page, browser }) => {
  test.setTimeout(150_000);
  const judul = `Kuis Singkat ${Date.now().toString(36)}`;
  await masuk(page, "admin@contoh.test");
  await page.goto("/ujian/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(judul);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Inggris" });
  await page.getByLabel("Dibuka mulai").fill(lokal(-60));
  await page.getByLabel("Ditutup pada").fill(lokal(120));
  await page.getByRole("spinbutton", { name: "Durasi pengerjaan (menit)" }).fill("1");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan/);
  const halamanAdmin = page.url().split("?")[0];
  await page.goto(`${halamanAdmin}/soal/baru`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox", { name: "Jenis soal" }).selectOption("isian");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Tulis satu kata.");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ujian diterbitkan" })).toBeVisible();

  const ctx = await browser.newContext();
  const murid = await ctx.newPage();
  await masuk(murid, "murid.contoh");
  await murid.getByRole("link", { name: new RegExp(judul) }).click();
  await murid.waitForLoadState("networkidle");
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Mulai ujian" }).click();
  await expect(murid.getByRole("timer", { name: "Sisa waktu" })).toHaveText(/^0[01]:\d\d$/);
  await murid.getByRole("textbox", { name: "Jawaban Anda" }).fill("kitab");
  // Tidak menekan Selesai: setelah ±1 menit ujian selesai sendiri
  await expect(murid.getByText("Ujian selesai dan jawaban Anda sudah tersimpan.")).toBeVisible({ timeout: 90_000 });
  await ctx.close();

  await page.goto(halamanAdmin);
  await expect(page.getByText("Peserta mulai: 1 · selesai: 1")).toBeVisible();
});
