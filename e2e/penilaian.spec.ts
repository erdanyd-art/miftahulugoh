import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

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

const galatForm = (page: Page) => page.locator("form [role=alert]:visible");

test("penilaian: PG otomatis, tutor pengampu menilai isian, admin mengumumkan, peserta melihat nilai", async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const judul = `UAS Nilai ${Date.now().toString(36)}`;

  // ===== admin menyiapkan ujian untuk kelas Bahasa Inggris (murid.contoh; diampu tutor2) =====
  await masuk(page, "admin@contoh.test");
  await page.goto("/ujian/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(judul);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Inggris" });
  await page.getByLabel("Dibuka mulai").fill(lokal(-60));
  await page.getByLabel("Ditutup pada").fill(lokal(120));
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan/);
  const halamanAdmin = page.url().split("?")[0];

  await page.goto(`${halamanAdmin}/soal/baru`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Pilih: book artinya?");
  await page.getByRole("textbox", { name: "Pilihan A" }).fill("Pena");
  await page.getByRole("textbox", { name: "Pilihan B" }).fill("Buku");
  await page.getByRole("radio", { name: "Kunci: pilihan B" }).check();
  await page.getByRole("spinbutton", { name: "Bobot nilai" }).fill("2");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await page.goto(`${halamanAdmin}/soal/baru`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox", { name: "Jenis soal" }).selectOption("isian");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Terjemahkan: school");
  await page.getByRole("textbox", { name: "Acuan jawaban untuk pemeriksa (opsional)" }).fill("sekolah");
  await page.getByRole("spinbutton", { name: "Bobot nilai" }).fill("3");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ujian diterbitkan" })).toBeVisible();

  // ===== peserta mengerjakan =====
  const ctxM = await browser.newContext();
  const murid = await ctxM.newPage();
  await masuk(murid, "murid.contoh");
  await murid.getByRole("link", { name: new RegExp(judul) }).click();
  await murid.waitForLoadState("networkidle");
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Mulai ujian" }).click();
  await murid.getByRole("radio", { name: /Buku/ }).check();
  await murid.getByRole("button", { name: "Berikutnya" }).click();
  await murid.getByRole("textbox", { name: "Jawaban Anda" }).fill("sekolah");
  await expect(murid.getByText("Semua jawaban tersimpan · 2/2 terjawab")).toBeVisible();
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Selesai dan kumpulkan" }).click();
  await expect(murid.getByText("Nilai akan tampil setelah diumumkan admin.")).toBeVisible();

  // ===== admin: PG sudah dinilai, belum bisa diumumkan sebelum ujian ditutup =====
  await page.goto(`${halamanAdmin}/hasil`);
  await page.waitForLoadState("networkidle");
  const baris = page.getByRole("listitem").filter({ hasText: "Peserta Lima" }).first(); // daftar nilai (sebelum daftar isian)
  await expect(baris).toContainText("40"); // 2 / 5
  await expect(baris).toContainText("1 isian belum dinilai");
  await expect(page.getByText("Ujian belum ditutup.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Umumkan nilai" })).toHaveCount(0);

  // ===== tutor lain tidak bisa; tutor pengampu menilai isian =====
  const ctxT = await browser.newContext();
  const tutor = await ctxT.newPage();
  await masuk(tutor, "tutor1@contoh.test");
  await tutor.goto("/periksa-ujian");
  await expect(tutor.getByRole("link", { name: new RegExp(judul) })).toHaveCount(0);
  await tutor.goto(`/periksa-ujian/${halamanAdmin.split("/").pop()}`);
  await expect(tutor.getByRole("heading", { name: new RegExp(`Hasil: ${judul}`) })).toHaveCount(0);
  await ctxT.clearCookies();

  await masuk(tutor, "tutor2@contoh.test");
  await tutor.goto("/periksa-ujian");
  const kartu = tutor.getByRole("link", { name: new RegExp(judul) });
  await expect(kartu).toContainText("1 isian belum dinilai");
  await kartu.click();
  await tutor.waitForLoadState("networkidle");
  await expect(tutor.getByText("Acuan: sekolah")).toBeVisible();
  await expect(tutor.getByRole("button", { name: "Umumkan nilai" })).toHaveCount(0);
  const skor = tutor.getByRole("spinbutton", { name: "Skor Peserta Lima (0 sampai 3)" });
  await skor.fill("4");
  await skor.press("Enter");
  // input max=3 menolak di browser; isi ulang dengan nilai sah
  await skor.fill("3");
  await tutor.getByRole("button", { name: "Simpan" }).click();
  await expect(tutor.getByRole("status").filter({ hasText: "Tersimpan." })).toBeVisible();
  await expect(tutor.getByRole("listitem").filter({ hasText: "Peserta Lima" }).first()).toContainText("100");
  await ctxT.close();

  // ===== admin menutup ujian, mengumumkan; peserta melihat nilai =====
  await page.goto(halamanAdmin);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Ditutup pada").fill(lokal(-1));
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Perubahan tersimpan." })).toBeVisible();
  await page.goto(`${halamanAdmin}/hasil`);
  await page.waitForLoadState("networkidle");
  await expect(baris).toContainText("100");
  await expect(baris).toContainText("Lengkap");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Umumkan nilai" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Nilai diumumkan" })).toBeVisible();

  const csv = await (await page.request.get(`/ekspor/nilai?ujian=${halamanAdmin.split("/").pop()}`)).text();
  expect(csv).toContain("Peserta Lima,Selesai,2,3,0,5,100");

  await murid.goto("/");
  await expect(murid.getByRole("link", { name: new RegExp(judul) })).toContainText("Nilai 100");
  await murid.getByRole("link", { name: new RegExp(judul) }).click();
  await expect(murid.getByText("Nilai Anda")).toBeVisible();
  await expect(murid.getByText("Skor 5 dari 5")).toBeVisible();
  await ctxM.close();
  await expect(galatForm(page)).toHaveCount(0);
});

test("peserta tidak bisa membuka halaman periksa dan ekspor nilai", async ({ page }) => {
  await masuk(page, "murid.contoh");
  await page.goto("/periksa-ujian");
  await expect(page).toHaveURL(/\/tidak-berwenang$/);
  const res = await page.request.get("/ekspor/nilai?ujian=00000000-0000-0000-0000-000000000000");
  expect(await res.text()).not.toContain("Skor pilihan ganda");
});
