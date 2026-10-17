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

const csv = (baris: string[]) => ({ name: "soal.csv", mimeType: "text/csv", buffer: Buffer.from(`${baris.join("\n")}\n`) });

test("duplikat ujian (soal, kunci, audio) lalu peserta mengerjakan versi acak; penilaian tetap benar", async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const kode = Date.now().toString(36);
  const sumber = `Bank Soal ${kode}`;
  const salinan = `Ujian Ulang ${kode}`;

  // ===== ujian sumber (kelas lain, waktu lampau-depan tidak penting) dengan audio dan 3 soal =====
  await masuk(page, "admin@contoh.test");
  await page.goto("/ujian/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(sumber);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Arab Dasar" });
  await page.getByLabel("Dibuka mulai").fill("2030-03-01T08:00");
  await page.getByLabel("Ditutup pada").fill("2030-03-01T10:00");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan/);
  const halSumber = page.url().split("?")[0];
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul audio" }).fill("Rekaman");
  await page.getByLabel("Berkas (MP3/M4A, maks. 10 MB)").setInputFiles({ name: "r.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("ID3 uji") });
  await page.getByRole("button", { name: "Unggah audio" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Audio diunggah." })).toBeVisible();
  await page.goto(`${halSumber}/impor`);
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Berkas CSV").setInputFiles(
    csv([
      "jenis,pertanyaan,a,b,c,d,kunci,acuan,bobot,audio",
      "pg,Ibukota Indonesia?,Bandung,Jakarta,Surabaya,Medan,b,,1,Rekaman",
      "pg,2 + 3 = ?,4,6,5,7,c,,1,",
      "isian,Sebutkan satu kata Arab,,,,,,kitab,1,",
    ]),
  );
  await page.getByRole("button", { name: "Impor 3 soal" }).click();
  await expect(page.getByRole("status").filter({ hasText: "3 soal berhasil diimpor." })).toBeVisible();

  // ===== duplikat ke kelas murid.contoh, dibuka sekarang, acak aktif =====
  await page.goto(halSumber);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Duplikat ujian" })).toHaveAttribute("href", /\/duplikat$/);
  await page.goto(`${halSumber}/duplikat`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("textbox", { name: "Judul ujian" })).toHaveValue(`Salinan - ${sumber}`);
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(salinan);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Inggris" });
  await page.getByLabel("Dibuka mulai").fill(lokal(-60));
  await page.getByLabel("Ditutup pada").fill(lokal(120));
  await page.getByRole("checkbox", { name: "Acak urutan soal untuk tiap peserta" }).check();
  await page.getByRole("checkbox", { name: "Acak urutan pilihan jawaban" }).check();
  await page.getByRole("button", { name: "Buat salinan" }).click();
  await expect(page).toHaveURL(/\/ujian\/[0-9a-f-]+\?pesan=disalin/);
  const halSalinan = page.url().split("?")[0];
  expect(halSalinan).not.toBe(halSumber);
  await expect(page.getByText("Salinan dibuat sebagai draf.")).toBeVisible();
  await expect(page.getByRole("heading", { name: salinan })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Soal (3)" })).toBeVisible();
  await expect(page.getByText("Audio: Rekaman")).toBeVisible();
  await expect(page.getByText("dipakai 1 soal")).toBeVisible();
  await expect(page.getByText("(kunci jawaban)").first().locator("..")).toContainText("Jakarta");
  await expect(page.getByRole("checkbox", { name: "Acak urutan soal untuk tiap peserta" })).toBeChecked();
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ujian diterbitkan" })).toBeVisible();

  // sumber tidak berubah
  await page.goto(halSumber);
  await expect(page.getByRole("heading", { name: "Soal (3)" })).toBeVisible();
  await expect(page.getByText("Draf").first()).toBeVisible();

  // ===== peserta mengerjakan versi acak, memilih jawaban benar menurut TEKS =====
  const ctx = await browser.newContext();
  const murid = await ctx.newPage();
  await masuk(murid, "murid.contoh");
  await murid.getByRole("link", { name: new RegExp(salinan) }).click();
  await murid.waitForLoadState("networkidle");
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Mulai ujian" }).click();
  await expect(murid.getByRole("timer", { name: "Sisa waktu" })).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await murid.getByRole("button", { name: new RegExp(`^Soal ${i + 1},`) }).click();
    const pertanyaan = murid.getByRole("region");
    if (await pertanyaan.getByText("Ibukota Indonesia?").count()) await murid.getByRole("radio", { name: /Jakarta/ }).check();
    else if (await pertanyaan.getByText("2 + 3 = ?").count()) await murid.getByRole("radio", { name: /\. 5$/ }).check();
    else await murid.getByRole("textbox", { name: "Jawaban Anda" }).fill("kitab");
  }
  await expect(murid.getByText("Semua jawaban tersimpan · 3/3 terjawab")).toBeVisible();
  murid.once("dialog", (d) => d.accept());
  await murid.getByRole("button", { name: "Selesai dan kumpulkan" }).click();
  await expect(murid.getByText("Nilai akan tampil setelah diumumkan admin.")).toBeVisible();
  await ctx.close();

  // ===== penilaian otomatis tetap benar walau pilihan diacak: 2 PG benar dari bobot 3 =====
  await page.goto(`${halSalinan}/hasil`);
  const baris = page.getByRole("listitem").filter({ hasText: "Peserta Lima" }).first();
  await expect(baris).toContainText("66,7");
  await expect(baris).toContainText("1 isian belum dinilai");
});
