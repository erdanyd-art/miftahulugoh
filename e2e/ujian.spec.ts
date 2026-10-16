import { expect, test, type Page } from "@playwright/test";

const SANDI = "dev-lokal-123"; // akun fiktif dari supabase/seed.sql

async function masuk(page: Page, identitas: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email atau username").fill(identitas);
  await page.getByLabel("Kata sandi", { exact: true }).fill(SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/masuk/);
}

async function buka(page: Page, jalur: string) {
  await page.goto(jalur);
  await page.waitForLoadState("networkidle");
}

test("admin menyusun ujian: soal pilihan ganda (Arab) + isian, audio, terbit, hapus", async ({ page }) => {
  test.setTimeout(90_000);
  const galatKonsol: string[] = [];
  page.on("console", (m) => m.type() === "error" && galatKonsol.push(m.text()));
  const judul = `UTS Uji ${Date.now().toString(36)}`;

  await masuk(page, "admin@contoh.test");
  await buka(page, "/ujian/baru");
  await page.getByRole("textbox", { name: "Judul ujian" }).fill(judul);
  await page.getByRole("combobox", { name: "Kelas" }).selectOption({ label: "Bahasa Arab Dasar" });
  await page.getByLabel("Dibuka mulai").fill("2030-01-10T08:00");
  await page.getByLabel("Ditutup pada").fill("2030-01-10T07:00");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.locator("form [role=alert]:visible")).toContainText("selesai setelah mulai");
  await page.getByLabel("Ditutup pada").fill("2030-01-10T12:00");
  await page.getByRole("spinbutton", { name: "Durasi pengerjaan (menit)" }).fill("45");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page).toHaveURL(/\/ujian\/[0-9a-f-]+\?pesan=disimpan/);
  await expect(page.getByRole("heading", { name: judul })).toBeVisible();
  await expect(page.getByText("10 Jan 2030 08.00 – 10 Jan 2030 12.00 · 45 menit")).toBeVisible();
  const halamanUjian = page.url().split("?")[0];

  // Belum ada soal: tidak bisa terbit
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.locator("form [role=alert]:visible")).toHaveText("Tambahkan minimal satu soal sebelum menerbitkan.");

  // Unggah audio (berkas kecil berjenis audio/mpeg)
  await page.getByRole("textbox", { name: "Judul audio" }).fill("Percakapan 1");
  await page.getByLabel("Berkas (MP3/M4A, maks. 10 MB)").setInputFiles({
    name: "percakapan.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("ID3 berkas uji, bukan audio sungguhan"),
  });
  await page.getByRole("button", { name: "Unggah audio" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Audio diunggah." })).toBeVisible();
  await expect(page.getByText("dipakai 0 soal")).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(1);

  // Soal pilihan ganda: validasi lalu simpan dengan teks Arab dan audio
  await page.getByRole("link", { name: "Tambah soal" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("ما معنى كلمة كتاب؟");
  await page.getByRole("textbox", { name: "Pilihan A" }).fill("Buku");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page.locator("form [role=alert]:visible")).toContainText("minimal 2 pilihan");
  await page.getByRole("textbox", { name: "Pilihan B" }).fill("Pena");
  await page.getByRole("textbox", { name: "Pilihan C" }).fill("Meja");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page.locator("form [role=alert]:visible")).toContainText("Pilih kunci jawaban");
  await page.getByRole("radio", { name: "Kunci: pilihan A" }).check();
  await page.getByRole("combobox", { name: "Audio (opsional)" }).selectOption({ label: "Percakapan 1" });
  await page.getByRole("spinbutton", { name: "Bobot nilai" }).fill("2");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await expect(page.getByText("ما معنى كلمة كتاب؟")).toHaveAttribute("dir", "auto");
  await expect(page.getByText("ما معنى كلمة كتاب؟")).toHaveClass(/text-xl/);
  await expect(page.getByText("Audio: Percakapan 1")).toBeVisible();
  await expect(page.getByText("dipakai 1 soal")).toBeVisible();

  // Soal isian
  await buka(page, `${halamanUjian}/soal/baru`);
  await expect(page.getByRole("spinbutton", { name: "Nomor" })).toHaveValue("2");
  await page.getByRole("combobox", { name: "Jenis soal" }).selectOption("isian");
  await page.getByRole("textbox", { name: "Pertanyaan" }).fill("Tulis arti kata madrasah.");
  await page.getByRole("textbox", { name: "Acuan jawaban untuk pemeriksa (opsional)" }).fill("sekolah");
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await expect(page.getByRole("heading", { name: "Soal (2)" })).toBeVisible();
  await expect(page.getByText("Total bobot: 3")).toBeVisible();
  await expect(page.getByText("Acuan jawaban: sekolah")).toBeVisible();

  // Ubah soal 1: kunci pindah ke B
  await page.getByRole("link", { name: "Ubah" }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("radio", { name: "Kunci: pilihan A" })).toBeChecked();
  await page.getByRole("radio", { name: "Kunci: pilihan B" }).check();
  await page.getByRole("button", { name: "Simpan soal" }).click();
  await expect(page).toHaveURL(/\?pesan=disimpan#soal/);
  await expect(page.getByText("(kunci jawaban)").locator("..")).toContainText("Pena");

  // Terbit, lalu daftar menampilkan status
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Terbitkan ujian" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ujian diterbitkan" })).toBeVisible();
  await buka(page, `/ujian?q=${encodeURIComponent(judul)}`);
  const baris = page.getByRole("link", { name: new RegExp(judul) });
  await expect(baris).toContainText("Terjadwal");
  await expect(baris).toContainText("2");

  // Hapus ujian (soal dan audio ikut terhapus)
  await baris.click();
  await page.waitForLoadState("networkidle");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Hapus ujian" }).click();
  await expect(page).toHaveURL(/\/ujian\?pesan=dihapus/);
  await buka(page, `/ujian?q=${encodeURIComponent(judul)}`);
  await expect(page.getByText("Belum ada ujian yang cocok.")).toBeVisible();

  expect(galatKonsol.filter((g) => !g.includes("favicon")), "galat konsol (termasuk CSP)").toEqual([]);
});

test("tutor dan peserta tidak bisa membuka menu Ujian admin", async ({ page }) => {
  for (const akun of ["tutor1@contoh.test", "murid.contoh"]) {
    await masuk(page, akun);
    for (const jalur of ["/ujian", "/ujian/baru"]) {
      await page.goto(jalur);
      await expect(page, `${akun} ${jalur}`).toHaveURL(/\/tidak-berwenang$/);
    }
    await page.context().clearCookies();
  }
});
