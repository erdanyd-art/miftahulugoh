import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

const csv = (baris: string[]) => ({ name: "soal.csv", mimeType: "text/csv", buffer: Buffer.from(`﻿${baris.join("\r\n")}\r\n`) });
const KEPALA = "nomor,jenis,pertanyaan,a,b,c,d,e,f,kunci,acuan,bobot,audio";

test("admin mengimpor soal dari CSV: pratinjau, baris bermasalah memblokir, impor atomik", async ({ page }) => {
  test.setTimeout(90_000);
  const judul = `Impor Soal ${Date.now().toString(36)}`;
  await masuk(page, "admin@contoh.test");

  // templat bisa diunduh
  const templat = await (await page.request.get("/ekspor/templat-soal")).text();
  expect(templat).toContain(KEPALA);

  await page.goto("/ujian/baru");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(judul);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Arab Dasar" });
  await page.getByLabel("Dibuka mulai").fill("2030-02-01T08:00");
  await page.getByLabel("Ditutup pada").fill("2030-02-01T12:00");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan/);
  const halaman = page.url().split("?")[0];
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Judul audio" }).fill("Dialog 1");
  await page.getByLabel("Berkas (MP3/M4A, maks. 10 MB)").setInputFiles({
    name: "dialog.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("ID3 uji"),
  });
  await page.getByRole("button", { name: "Unggah audio" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Audio diunggah." })).toBeVisible();

  await page.getByRole("link", { name: "Impor CSV" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("(Dialog 1)")).toBeVisible();

  // Berkas dengan baris bermasalah: impor diblokir
  const berkas = page.getByLabel("Berkas CSV");
  await berkas.setInputFiles(
    csv([KEPALA, ",pg,Soal benar,X,Y,,,,,a,,,", ",pg,Kunci salah,X,Y,,,,,d,,,", ",isian,Pakai audio asing,,,,,,,,,,Tidak Ada"]),
  );
  await expect(page.getByText("1 siap diimpor")).toBeVisible();
  await expect(page.getByText("2 bermasalah")).toBeVisible();
  await expect(page.getByText("Kunci harus salah satu huruf A–B")).toBeVisible();
  await expect(page.getByText('Audio "Tidak Ada" belum diunggah di ujian ini')).toBeVisible();
  await expect(page.getByRole("button", { name: "Impor 1 soal" })).toBeDisabled();

  // Berkas benar: Arab, pilihan ganda dengan audio, isian dengan acuan, nomor otomatis
  await berkas.setInputFiles(
    csv([
      KEPALA,
      ',pg,"ما معنى كلمة ""كتاب""؟",Buku,Pena,Meja,,,,A,,2,Dialog 1',
      ",pg,Apa arti qalam?,Buku,Pena,,,,,b,,,dialog 1",
      ",isian,Terjemahkan: مدرسة,,,,,,,,sekolah,3,",
    ]),
  );
  await expect(page.getByText("3 siap diimpor")).toBeVisible();
  await page.getByRole("button", { name: "Impor 3 soal" }).click();
  await expect(page.getByRole("status").filter({ hasText: "3 soal berhasil diimpor." })).toBeVisible();

  await page.goto(halaman);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Soal (3)" })).toBeVisible();
  await expect(page.getByText("Total bobot: 6")).toBeVisible();
  await expect(page.getByText('ما معنى كلمة "كتاب"؟')).toBeVisible();
  await expect(page.getByText("dipakai 2 soal")).toBeVisible();
  await expect(page.getByText("Acuan jawaban: sekolah")).toBeVisible();
  await expect(page.getByText("No. 3")).toBeVisible();
});

test("tutor tidak bisa membuka impor soal maupun templatnya", async ({ page }) => {
  await masuk(page, "tutor1@contoh.test");
  await page.goto("/ujian/00000000-0000-0000-0000-000000000000/impor");
  await expect(page).toHaveURL(/\/tidak-berwenang$/);
  const res = await page.request.get("/ekspor/templat-soal");
  expect(await res.text()).not.toContain("pertanyaan");
});
