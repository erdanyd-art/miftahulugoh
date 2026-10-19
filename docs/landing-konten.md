# docs/landing-konten.md — Isi nyata landing page (dari brosur lembaga)

Versi: 0.1 · Tanggal: 2026-10-19

Berkas ini **menggantikan isi (teks dan struktur program)** di `docs/landing-page.md`. Bagian visual (token warna, tipografi, bentuk, SVG, aksesibilitas, SEO, implementasi Next.js) di `docs/landing-page.md` tetap berlaku. Jika bertentangan soal **isi**, berkas ini menang.

Sumber isi: brosur resmi lembaga, `docs/referensi-brosur.jpg` (buka gambarnya). Brosur adalah sumber kebenaran isi; **jangan menambah klaim yang tidak ada di brosur**. Gaya visual brosur sudah searah dengan desain landing page kita (limau, navy, stiker putus-putus), tetapi tata letak landing page tetap mengikuti `docs/landing-reference.html`, bukan menyalin brosur.

## 1. Perubahan besar dari draf lama

1. **Programnya satu: Program Bahasa Arab (Kitab ABY 1–8, 8 tingkat).** Tiga kartu bukan lagi "Arab / Inggris / Nahwu Shorof", melainkan tiga **jenis kelas**: Reguler, Semi Privat, Privat. Brosur tidak menyebut Bahasa Inggris maupun Nahwu Shorof, jadi **hapus semua penyebutannya** di landing page (hero, pita, kartu, metadata) (sudah dikonfirmasi pemilik lembaga: keduanya tidak ditawarkan; lihat bagian 6).
2. **Sapaan memakai "Anda"**, mengikuti brosur (bukan "kamu").
3. Harga, jumlah pertemuan, dan durasi **sudah ada** dan boleh tampil sebagai data asli (bagian 3). Jadwal hari/jam per kelas tidak ada di brosur; jangan dikarang.

## 2. Teks (bahasa Indonesia, pakai apa adanya)

**Navigasi:** logo + "Miftah al-Lughah" dengan sublabel "Program Bahasa Arab". Tautan: Program (`#program`), Kurikulum (`#kurikulum`), Daftar (`#daftar`); tombol "Masuk" → `/masuk` (rute masuk aplikasi).

**Hero**
- Stiker: "Kelas Online", "Kitab ABY 1–8", dan "Tersedia 8 Tingkat Pembelajaran".
- H1: "Program Miftah al-Lughah" (kata "Miftah" atau "kunci" boleh diberi sorotan pil limau seperti desain; jangan menambah kata baru).
- Subjudul stiker: "Belajar Bahasa Arab Menjadi Jauh Lebih Mudah!"
- Paragraf: "Dengan metode yang terstruktur, bimbingan pengajar berpengalaman, dan pilihan kelas sesuai kebutuhan Anda."
- Balon bicara dekoratif: "Ayo Belajar Bahasa Arab!" (menggantikan "Hello!"); balon Arab "مرحبا!" boleh dipertahankan.
- Tombol utama "Daftar Sekarang" → WhatsApp; tautan "Lihat program" → `#program`.
- Kartu fakta hero: "Online via Google Meet", "12 pertemuan per bulan", "±60 menit per pertemuan".

**Pita miring (dekoratif):** "Bahasa Arab ✦ Kitab ABY ✦ 8 Tingkat ✦ مفتاح اللغة" (bintang sebagai SVG).

**Program** (`#program`): judul "Pilih kelasmu" diganti **"Pilih kelas Anda"**; stiker "3 jenis kelas". Tiga kartu (gunakan tiga varian warna kartu yang sudah ada: limau, biru, periwinkle):

| | Reguler | Semi Privat | Privat |
|---|---|---|---|
| Peserta | 5–7 peserta per kelas | 2 peserta per kelas | 1 peserta per kelas |
| Harga | Rp100.000 /peserta/bulan | Rp175.000 /peserta/bulan | Rp275.000 /bulan (Per Tingkat) |
| Deskripsi | Belajar bersama dalam kelompok kecil dengan suasana yang interaktif, suportif, dan kondusif. | Pendampingan lebih intensif dengan jumlah peserta terbatas untuk interaksi yang lebih maksimal bersama pengajar. | Pembelajaran eksklusif dengan pendekatan personal, disesuaikan sepenuhnya dengan kemampuan dan target belajar Anda. |
| Cocok untuk | Peserta yang menginginkan pembelajaran terstruktur dengan biaya terjangkau. | Peserta yang menginginkan pendampingan lebih intensif dengan biaya yang tetap. | Peserta yang menginginkan pembelajaran fokus dan pendampingan yang lebih. |

Di bawah kartu: catatan kecil **wajib** "*Harga untuk 1 tingkat" (harga berlaku per tingkat; lihat bagian 6). Ikon: tiga orang (Reguler), dua orang (Semi Privat), satu orang (Privat); gambar sebagai SVG buatan sendiri.

**Kurikulum & sistem pembelajaran** (`#kurikulum`): stiker "Program terdiri dari 8 tingkat (level)". Daftar:
- Materi: Kitab ABY (Mustawa 1–8), total 8 tingkat pembelajaran
- Pertemuan: 12 kali per bulan
- Durasi: ±60 menit per pertemuan
- Ujian: 4 maharah

(Baris "Pendampingan" di brosur tidak punya isi. **Jangan ditampilkan**.)

**4 Maharah yang diujikan** (empat kartu; teks Arab `lang="ar" dir="rtl"`):
- Istima' (الاستماع), Menyimak
- Kalam (الكلام), Berbicara
- Qira'ah (القراءة), Membaca
- Kitabah (الكتابة), Menulis

(Di gambar brosur tulisan Arab Kitabah terbaca keliru, "الكمانة". Yang benar **الكتابة**; pakai ini.)

**Fasilitas** (daftar centang):
- Pembelajaran sesuai tingkatan kitab ABY
- 12 pertemuan per bulan
- Evaluasi 4 maharah
- Latihan & pemantauan perkembangan
- Konsultasi pengajar
- Akses materi tambahan (jika tersedia) → sudah diputuskan, lihat bagian 6 (tanpa kata "portal belajar")

**Cara belajar** (`#cara`): tetap tiga langkah seperti `docs/landing-page.md`, tetapi sapaan "Anda": 1. Daftar, "Hubungi kami dan pilih jenis kelas yang cocok untuk Anda." 2. Terima jadwal & tautan, "Anda mendapat jadwal pertemuan dan tautan Google Meet." 3. Belajar bersama pengajar, "Ikuti pertemuan tiap bulan sesuai tingkat Anda. Kehadiran dicatat oleh pengajar."

**Pendaftaran** (`#daftar`): judul "Mulai dari sekarang, menuju kemahiran berbahasa Arab!" (kalimat penutup brosur), tombol "Daftar Sekarang" → WhatsApp, lalu tiga baris kontak (nomor WhatsApp, Instagram, alamat/kota) tetap placeholder sampai datanya ada.

**Footer:** sama seperti sebelumnya.

**Metadata:** judul "Lembaga Miftah al-Lughah — Kursus Bahasa Arab Online (Kitab ABY 1–8)"; deskripsi "Kelas Bahasa Arab online dengan Kitab ABY, 8 tingkat pembelajaran. Pilih kelas Reguler, Semi Privat, atau Privat."

## 3. Konfigurasi konten (ganti bentuk `lib/site-content.ts`)

Harga dan jumlah kelas menjadi data, bukan teks di dalam komponen:

```ts
export const siteContent = {
  waNumber: "", waMessage: "Assalamu'alaikum, saya ingin mendaftar di Lembaga Miftah al-Lughah.",
  instagram: "", address: "",
  kelas: [
    { key: "reguler",    nama: "Reguler",     peserta: "5–7 peserta per kelas", harga: 100000, satuan: "/peserta/bulan" },
    { key: "semi-privat", nama: "Semi Privat", peserta: "2 peserta per kelas",   harga: 175000, satuan: "/peserta/bulan" },
    { key: "privat",     nama: "Privat",      peserta: "1 peserta per kelas",   harga: 275000, satuan: "/bulan (Per Tingkat)" },
  ],
  pertemuanPerBulan: 12, durasiMenit: 60, jumlahTingkat: 8,
};
```

Format harga lewat satu fungsi `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })`. Nomor WhatsApp, Instagram, dan alamat tetap kosong → placeholder.

## 4. Logo

Brosur memakai logo lembaga (buku terbuka berornamen). **Jangan menggambar ulang logo dari gambar brosur.** Sampai pemilik menyediakan berkas logo (SVG atau PNG transparan), pertahankan ikon sementara yang sudah ada dan beri komentar `TODO logo asli`. Setelah berkas ada: taruh di `public/` dan ganti ikon navigasi.

## 5. Kriteria selesai tambahan

- Semua teks dan angka di bagian 2 dan 3 cocok dengan brosur (periksa satu per satu terhadap `docs/referensi-brosur.jpg`).
- Tidak ada kata "Inggris", "English", atau "Nahwu" di landing page, SEO, dan pita.
- Teks Arab empat maharah benar dan terbaca kanan ke kiri.
- Harga tampil dari konfigurasi dan diformat rupiah dengan benar.
- Tangkapan layar Playwright di 360, 390, 768, 1024, dan 1440 px; tidak ada gulir ke samping.

## 6. Keputusan pemilik lembaga (19 Okt 2026) dan yang masih terbuka

**Sudah diputuskan:**
1. **Harga berlaku per tingkat.** Tampilkan teks harga persis seperti brosur ("/peserta/bulan", "/bulan (Per Tingkat)") dan **wajib** sertakan catatan "*Harga untuk 1 tingkat" di bawah ketiga kartu, agar jelas. Jangan mengubah satuan atau menghitung total sendiri.
2. **Baris fasilitas terakhir:** tulis "Akses materi tambahan (jika tersedia)". **Jangan menyebut "portal belajar"**: portal peserta belum ada di aplikasi.
3. **Baris "Pendampingan"** di kurikulum: tidak ditampilkan (brosur kosong).
4. **Bahasa Inggris dan Nahwu Shorof tidak ditawarkan.** Landing page hanya untuk Program Bahasa Arab.

**Masih terbuka (tetap placeholder / TODO, jangan ditebak):**
- ~~Nomor WhatsApp~~ diisi 2026-10-19 (0878-6355-4350, di `lib/site-content.ts` sebagai `6287863554350`). Akun Instagram, alamat/kota masih terbuka.
- Berkas logo asli (SVG atau PNG transparan).
- Jadwal hari dan jam per kelas (tidak ada di brosur).
- Kepanjangan "ABY" dan izin menuliskannya lengkap (kemungkinan al-'Arabiyyah bayna yadayk).
