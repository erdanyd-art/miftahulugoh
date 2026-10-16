# PRD — Dashboard Lembaga Miftah al-Lughah

Versi: 0.14 (draft untuk disetujui) · Tanggal: 2026-10-16
Penulis: Erdany (dengan bantuan Claude sebagai arsitek)

> Dokumen ini adalah sumber kebenaran kebutuhan produk. Claude Code wajib membacanya sebelum mengerjakan tugas apa pun, dan tidak boleh menambah fitur di luar bagian yang ditandai "Fase 1".

## 1. Latar belakang

Lembaga Miftah al-Lughah (kursus Bahasa Arab, Bahasa Inggris, Nahwu Shorof) mengelola operasional di Google Sheets dengan backend Google Apps Script (versi beta, nama file "MiftahLugohBeta"). Kami menggantinya dengan web dashboard sendiri di domain sendiri, dengan login, database terstruktur, dan fondasi yang bisa berkembang.

Proyek ini dibuat untuk membantu seorang teman. Ini **bukan** bagian dari Bimbel OS dan **bukan** multi-tenant. Spesifikasi asli beta (3 peran, honor otomatis, keuangan, ujian CBT) menjadi acuan fitur; bagian 5 dan 6 menyusunnya per fase.

## 2. Tujuan

1. Admin dan tutor mengelola data lembaga lewat web, tanpa membuka Google Sheets.
2. Hak akses dipisah per peran dan ditegakkan di database.
3. Data tersimpan di database relasional dengan integritas dan keamanan yang benar.
4. Mudah dirawat oleh satu orang dan mudah dikembangkan (termasuk portal peserta di Fase 2) tanpa membangun ulang fondasi.

## 3. Identitas dan tampilan

- Nama: **Lembaga Miftah al-Lughah**.
- Warna dasar: **biru tua** (navy). Warna aksen dan design system ditetapkan di dokumen desain, dengan kontras teks yang memenuhi standar keterbacaan.
- Responsif: nyaman di ponsel dan desktop. Ponsel diutamakan untuk tutor (absen) dan peserta.
- Bahasa antarmuka: Indonesia. Teks Arab (misalnya soal ujian) harus tampil benar dari kanan ke kiri.

## 4. Pengguna dan hak akses

| Peran | Fase | Hak |
|---|---|---|
| `admin` | 1 | Akses penuh: pengguna, peserta, kelas, jadwal, honor, absensi, pembayaran, keuangan, (Fase 2) ujian. |
| `tutor` | 1 | Hanya data miliknya: jadwal dan kelas yang diampu, absensi sesi miliknya, honor miliknya, tautan Meet jadwal miliknya. Tidak boleh melihat Keuangan atau Pembayaran. (Fase 2) memeriksa jawaban isian dan melihat nilai kelasnya. |
| `peserta` | 2 | Hanya data dirinya: jadwal, tombol Meet, riwayat pembayaran sendiri, ujian, nilai. |

Aturan:
- Admin membuat akun; pengguna menetapkan kata sandi sendiri. Tidak ada kata sandi bawaan bersama.
- Pendaftaran publik dimatikan. Akun nonaktif tidak bisa masuk.
- Di Fase 1 peserta hanya berupa data (record) tanpa akun, tetapi tabel `peserta` sudah disiapkan agar bisa dihubungkan ke akun login di Fase 2 tanpa perubahan struktur besar.

## 5. Fase 1 — MVP (admin dan tutor)

### 5.1 Autentikasi
- Login email + kata sandi, logout, reset kata sandi. Halaman terproteksi mengarahkan pengguna belum login ke halaman login.

### 5.2 Dashboard
- **Admin (desktop):** (a) absensi tutor **hari ini**: setiap jadwal hari ini beserta status (belum absen / sudah absen, hadir dari total); (b) status keuangan: pemasukan, pengeluaran, selisih bulan berjalan, dan jumlah pembayaran peserta berstatus Belum Lunas.
- **Tutor:** jadwal aktif hari ini miliknya, dengan tombol Absen.

### 5.3 Pengguna (admin)
- Tambah, ubah, nonaktifkan admin/tutor. Tidak ada hapus permanen; gunakan nonaktifkan.

### 5.4 Menu Kelas
- **Admin:** CRUD kelas; CRUD peserta; **impor peserta dari CSV** (nama, catatan, kelas; pratinjau dulu, nama yang sudah ada dilewati, atomik); kelola anggota kelas (peserta banyak-ke-banyak kelas); CRUD jadwal pembelajaran (kelas, tutor, hari, jam mulai/selesai, **honor per sesi**, tautan Meet).
- **Tutor:** melihat jadwal dan kelas yang diampu (hanya miliknya). Tutor boleh mengubah **tautan Meet** jadwal miliknya, dan tidak boleh mengubah kolom lain.
- Validasi: jam selesai harus setelah jam mulai. Nama kelas sudah mewakili mata pelajaran (kolom `mapel` lama tidak dipakai).

### 5.5 Absensi dan honor
- Satu **sesi** = satu pertemuan pada satu tanggal untuk satu jadwal. Satu jadwal hanya boleh punya satu sesi per tanggal.
- **Jendela absen:** tutor dapat mengabsen sesi miliknya **mulai jam mulai jadwal sampai pergantian tanggal**. Pengecekan waktu dilakukan di server/database, bukan jam perangkat pengguna.
- Tutor menandai **per murid** hadir / tidak hadir (daftar murid dari anggota kelas). `hadir` dan `total` dihitung otomatis, tidak diketik manual.
- **Aturan honor (otomatis, dihitung di server saat absensi disimpan):**
  - Jika jumlah hadir ≥ 1: honor sesi = honor yang ditetapkan admin pada jadwal.
  - Jika jumlah hadir = 0: honor sesi = **setengah** dari honor jadwal (dibulatkan ke bawah ke rupiah penuh).
  - Admin dapat mengoreksi honor sesi secara manual; koreksi tercatat di log audit.
  - Aturan ini sesuai data beta: sesi dengan honor jadwal 120.000 dan hadir 0 tercatat 60.000.
- Honor yang terkumpul tampil di akun tutor sebagai riwayat dan total per periode (bulan). Tutor hanya melihat miliknya; admin melihat semua.
- **Saldo honor tutor** = total honor sesi dikurangi pembayaran honor yang dicatat admin di kas (kategori "Honor Tutor" dengan tutor tertentu). Dihitung dari data, tidak disimpan sebagai angka terpisah.
- Admin dapat mengunci sesi; sesi terkunci tidak bisa diubah tutor.
- Admin boleh mengoreksi absensi tanggal lampau, tetapi tidak boleh mencatat absensi untuk tanggal yang belum tiba.

### 5.6 Keuangan (khusus admin)
- **Kas:** CRUD pemasukan dan pengeluaran (tanggal, jenis, kategori, keterangan, jumlah). Kategori awal: Donasi, Infaq, Operasional, Honor Tutor, Honor Pegawai (dapat ditambah admin). Untuk kategori Honor Tutor, admin wajib memilih tutornya (kolom `tutor_id`), agar saldo honor bisa dihitung.
- **Pembayaran peserta:** CRUD (tanggal, peserta, keterangan seperti SPP/infaq, jumlah, status `Lunas` / `Belum Lunas`), dengan filter status, peserta, bulan.
- **Pembayaran berstatus Lunas otomatis tercatat sebagai pemasukan kas** (kategori "Pembayaran Peserta"); perubahan atau penghapusan pembayaran ikut menyesuaikan kas (D13).
- **Rekap:** ringkasan per bulan untuk kas, pembayaran peserta, dan honor tutor/pegawai. Pemasukan kas sudah termasuk pembayaran Lunas; kolom pembayaran adalah rinciannya.
- Ekspor CSV untuk pembayaran, kas, dan rekap honor.

### 5.7 Umum
- Tabel dengan pencarian, filter, urutan, dan pagination.
- Log audit untuk tindakan penting (ubah/hapus pembayaran, kas, honor, kunci sesi, ubah pengguna): siapa, kapan, apa.

### 5.8 Halaman publik (landing page)
- Rute `/` berupa halaman statis yang memperkenalkan lembaga dan tiga program (Bahasa Arab Dasar, Bahasa Inggris Percakapan, Nahwu Shorof), dengan tombol **Daftar** (membuka WhatsApp lembaga; tidak ada formulir pendaftaran) dan **Masuk** (tautan ke halaman masuk `/masuk`).
- Tidak membaca database, tidak memakai kunci apa pun, tanpa login. Tanpa testimoni, harga, atau klaim yang tidak disediakan pemilik lembaga.
- Gaya visual sendiri (ceria, kertas berkotak, ilustrasi SVG buatan sendiri), terpisah dari gaya dashboard. Spesifikasi lengkap: `docs/landing-page.md`; acuan visual: `docs/landing-reference.html`.
- Kontak, jadwal, dan biaya per program disimpan di satu berkas konfigurasi konten; selama kosong, ditampilkan sebagai placeholder.
- Hanya `/` yang boleh diindeks mesin pencari.
- Landing tampil di `/` untuk pengunjung yang belum masuk; pengguna yang sudah masuk tetap melihat dashboard di `/` (dashboard tidak berubah).

## 6. Fase 2 — Portal peserta dan ujian CBT

Dikerjakan setelah Fase 1 stabil. Tidak ada kode Fase 2 yang dibuat di Fase 1, kecuali kesiapan struktur yang disebut di bagian 4.

### 6.1 Portal peserta
- Login peserta (akun dibuat admin, peserta menetapkan kata sandi sendiri).
- Jadwal pelajaran kelas miliknya dan tombol masuk ke tautan Google Meet yang diatur tutor/admin.
- Riwayat pembayaran **miliknya sendiri** (hanya baca).

### 6.2 Ujian CBT
- **Admin** mengatur ujian: judul, kelas, **rentang waktu mulai–selesai**, **durasi pengerjaan**, serta soal dan kunci jawaban.
- Jenis soal: **pilihan ganda** (dinilai otomatis) dan **isian** (diperiksa manual oleh tutor/admin). Setiap soal punya bobot.
- Peserta melihat tombol **Mulai** hanya selama rentang waktu ujian. Timer ditegakkan di server; jawaban setelah waktu habis ditolak.
- **Kunci jawaban tidak boleh pernah terkirim ke peserta** (disimpan terpisah dan tidak terbaca oleh peran peserta).
- Nilai akhir = nilai otomatis + nilai isian yang diperiksa manual. Nilai dapat dibaca peserta (miliknya), tutor (kelas yang diampu), dan admin (semua).
- Asumsi: satu kali percobaan per peserta per ujian.
- **Soal audio (D14):** admin mengunggah audio (mp3/m4a, maks ±10 MB) ke penyimpanan privat. Satu audio boleh dipakai beberapa soal (mis. satu percakapan untuk 3 soal). Peserta memutar lewat tautan sementara, hanya selama percobaannya berlangsung; putar ulang bebas. Jawaban rekaman suara (speaking) belum.
- **Nilai diumumkan admin:** peserta melihat nilai setelah admin menekan "Umumkan nilai" (setelah isian diperiksa).

## 7. Model data tingkat tinggi

Skema SQL rinci, constraint, indeks, dan kebijakan RLS ada di dokumen terpisah (`docs/schema.md`).

**Fase 1**

| Tabel | Isi utama |
|---|---|
| `pengaturan` | Satu baris konfigurasi: nama lembaga, zona waktu lembaga |
| `profiles` | Pengguna login: terhubung ke Supabase Auth, nama, peran, status aktif |
| `kategori_kas` | Daftar kategori kas (jenis, apakah wajib memilih tutor); admin dapat menambah |
| `peserta` | Murid: nama, aktif, catatan, `user_id` (opsional, untuk Fase 2) |
| `kelas` | Nama, keterangan |
| `kelas_peserta` | Relasi kelas dan peserta (unik per pasangan) |
| `jadwal` | kelas, tutor, hari, jam mulai/selesai, honor, tautan Meet |
| `sesi` | Satu pertemuan: jadwal, tanggal, hadir, total, honor, status kunci |
| `absensi_murid` | sesi, peserta, hadir/tidak (unik per sesi dan peserta) |
| `pembayaran` | tanggal, peserta, keterangan, jumlah, status |
| `kas` | tanggal, jenis, kategori, keterangan, jumlah, `tutor_id` (opsional, wajib untuk kategori Honor Tutor) |
| `audit_log` | siapa, kapan, aksi, data sebelum/sesudah |

**Fase 2 (migrasi terpisah):** `ujian`, `audio_ujian` (berkas di Storage privat), `soal`, `soal_kunci` (tidak terbaca peserta), `percobaan_ujian`, `jawaban`.

Prinsip:
- Primary key `uuid`. Uang sebagai bilangan bulat rupiah (bukan float, bukan teks). Jam bertipe `time`, tanggal bertipe `date`.
- Foreign key dengan constraint; nilai pilihan (peran, jenis, status) memakai enum/check constraint.
- `jadwal` menyimpan honor standar; `sesi` menyimpan honor hasil hitung sebagai nilai terpisah agar perubahan honor jadwal tidak mengubah riwayat.
- Hanya satu zona waktu lembaga, disimpan sebagai konfigurasi, dipakai untuk "hari ini" dan jendela absen.

## 8. Persyaratan non-fungsional

**Keamanan (wajib)**
- Row Level Security aktif di **semua** tabel. Keamanan ada di database, bukan di antarmuka. Menyembunyikan menu atau halaman tidak dianggap pengamanan.
- Kunci `service_role` tidak pernah dikirim ke browser dan tidak diberi awalan `NEXT_PUBLIC_`.
- Tutor tidak dapat membaca `pembayaran`, `kas`, atau data tutor lain; peserta (Fase 2) hanya data dirinya. Semua diuji langsung pada level database.
- Perhitungan honor dan validasi jendela absen dilakukan di server/database, bukan di browser.
- Semua input divalidasi di server (skema Zod) dan di database (constraint).
- Kata sandi tidak pernah disimpan atau dicatat sendiri (memakai Supabase Auth). Hash lama dari Google Sheets tidak dimigrasi.

**Data dan operasional**
- Backup terjadwal dan prosedur pemulihan terdokumentasi sebelum dipakai data nyata.
- Penghapusan data keuangan memakai soft delete.
- Biaya awal diupayakan di paket gratis Supabase + Vercel selama lembaga kecil; domain sendiri berbayar.
- Struktur kode sederhana, tanpa lapisan abstraksi yang belum dibutuhkan, agar satu orang bisa merawatnya.

## 9. Keputusan, asumsi, dan hal yang ditunda

| # | Keputusan / asumsi | Status |
|---|---|---|
| D1 | Satu lembaga, tanpa multi-tenant | Dikonfirmasi |
| D2 | Fase 1 hanya admin dan tutor yang login. **Ujian CBT dibutuhkan** (Fase 2), dikerjakan **setelah Fase 1 dipasang di domain (Sprint 8)** | Diputuskan Erdany, 2026-10-15 |
| D9 | Saldo honor tutor masuk Fase 1 dalam bentuk ringan (honor sesi dikurangi pembayaran honor di kas) | Disetujui sementara ("mungkin iya"); mudah dibalik |
| D3 | Absensi dicatat per murid | Dikonfirmasi |
| D4 | ~~Pembayaran peserta tidak otomatis masuk kas~~ | Diganti D13 |
| D5 | Google Sheets ditinggalkan; beta, data uji tidak dimigrasi | Asumsi, perlu konfirmasi |
| D6 | Honor otomatis (hadir ≥ 1 penuh, hadir 0 setengah) masuk Fase 1 | Aturan dari spesifikasi asli, cocok dengan data beta |
| D7 | Ujian CBT dan portal peserta ditunda ke Fase 2 | Mengikuti D2 |
| D8 | Stack: Next.js + TypeScript, Supabase (PostgreSQL + Auth), Vercel, GitHub | Rekomendasi, cocok untuk skala ini |
| D10 | Impor peserta dari CSV di Fase 1 (pengganti input dari spreadsheet) | Disetujui Erdany, 2026-10-15 |
| D11 | Peserta login dengan **username + kata sandi** (tanpa email). Admin membuat akun dengan kata sandi awal; **wajib diganti saat login pertama** (pengecualian terkendali dari aturan "tanpa kata sandi bawaan", khusus peserta) | Diputuskan Erdany, 2026-10-15 |
| D13 | Pembayaran peserta berstatus **Lunas otomatis masuk kas** (kategori "Pembayaran Peserta", disinkron trigger database; tidak bisa dicatat/diubah manual di Kas) | Diputuskan Erdany, 2026-10-15 |
| D14 | Ujian CBT: soal boleh berisi **audio** (satu audio dapat dipakai beberapa soal), putar bebas selama ujian, **nilai tampil setelah diumumkan admin**, belum ada jawaban rekaman suara | Diputuskan Erdany, 2026-10-15 |
| D15 | Admin dapat **mengimpor soal ujian dari CSV** (pratinjau dulu, atomik, aturan sama dengan form soal) | Diminta Erdany, 2026-10-16 |
| D12 | Fase 2 tahap pertama: **ujian saja** (daftar ujian, mengerjakan, nilai). Portal peserta lain (jadwal, Meet, riwayat pembayaran; bagian 6.1) menyusul | Diputuskan Erdany, 2026-10-15 |

## 10. Pertanyaan yang masih terbuka

1. ~~Peserta login (D2)~~ Diputuskan: ujian CBT dibutuhkan, login username (D11, D12).
2. ~~Saldo honor~~ Diputuskan sementara: masuk Fase 1 (D9).
3. **Sesi tanpa peserta terdaftar** (total = 0): honor penuh atau setengah?
4. **"Atur pembayaran"** pada spesifikasi asli: apakah berarti menetapkan tagihan (misalnya nominal SPP per kelas/peserta), atau hanya mencatat pembayaran seperti sekarang?
5. ~~Rekap keuangan~~ Diputuskan: pembayaran Lunas masuk kas (D13).
6. Zona waktu lembaga (WIB/WITA), ukuran lembaga (tutor, peserta, kelas aktif), pemilik akun Supabase/Vercel/domain dan siapa yang merawat, nama domain, anggaran bulanan.
7. Adakah data nyata dari Sheets yang harus dibawa (misalnya daftar kelas dan peserta aktif)?

## 11. Kriteria selesai Fase 1

- Admin dapat mengelola seluruh data di bagian 5 tanpa membuka Google Sheets.
- Tutor hanya dapat melihat dan mengubah data miliknya; pengujian RLS membuktikannya.
- Honor sesi terhitung benar untuk kasus hadir ≥ 1 dan hadir = 0; absen di luar jendela waktu ditolak oleh database.
- Tidak ada tabel tanpa RLS.
- Tersedia di domain sendiri dengan HTTPS, tampil baik di ponsel dan desktop.
- Backup dan pemulihan sudah dicoba satu kali.

## 12. Cara Claude Code memakai dokumen ini

- Kerjakan per sprint kecil; jangan membangun seluruh aplikasi sekaligus.
- Jangan menambah fitur atau tabel di luar dokumen ini; tanyakan dulu.
- Perubahan skema lewat file migrasi, bukan lewat penyuntingan manual di dasbor Supabase.
- Setiap tabel baru wajib disertai kebijakan RLS dan pengujiannya.
- Jangan mengerjakan apa pun dari Fase 2 sebelum Fase 1 disetujui.

## Riwayat perubahan

- v0.14: impor soal ujian dari CSV (D15): templat, pratinjau per baris, atomik, kolom pg/isian/kunci/acuan/bobot/audio.
- v0.13: Sprint 13 — portal peserta (6.1): jadwal kelas yang diikuti dengan tombol Google Meet (kelas hari ini di Beranda) dan riwayat pembayaran sendiri (baca saja).
- v0.12: Sprint 12 — penilaian: pilihan ganda otomatis dari kunci (koreksi kunci langsung berlaku), isian dinilai admin/tutor pengampu (0..bobot, diaudit), nilai = skor/total bobot × 100, pengumuman admin setelah ujian ditutup, peserta melihat nilai sendiri tanpa kunci per soal, ekspor CSV. Fase 2 tahap pertama (D12) selesai.
- v0.11: Sprint 11 — peserta mengerjakan ujian (mulai dalam jendela, timer server, simpan otomatis, satu percobaan, selesai otomatis saat waktu habis; toleransi jaringan 15 detik untuk jawaban terakhir).
- v0.10: Sprint 2b — bagian 5.8 halaman publik (landing page) beserta `docs/landing-page.md` dan `docs/landing-reference.html`.
- v0.9: Sprint 10 — admin menyusun ujian (soal pilihan ganda/isian, bobot, audio di Storage privat, terbit/draf).
- v0.8: Sprint 9 — akun peserta (username + sandi awal acak, wajib ganti saat masuk pertama, reset oleh admin). UAT Fase 1 selesai (2026-10-16).
- v0.7: rencana ujian CBT dengan soal audio dan pengumuman nilai (D14).
- v0.6: pembayaran Lunas otomatis masuk kas (D13, menggantikan D4).
- v0.5: impor peserta dari CSV (D10); fungsi database `impor_peserta`. Keputusan Fase 2: ujian CBT setelah Sprint 8 (D2), login peserta username + ganti sandi pertama (D11), tahap pertama ujian saja (D12).
- v0.4: menambah tabel `pengaturan` dan `kategori_kas` (sesuai `docs/schema.md`); admin tidak boleh mencatat absensi tanggal yang belum tiba.
- v0.3: peserta login ditunda (tidak menghalangi Fase 1); saldo honor tutor masuk Fase 1; kolom `tutor_id` opsional di `kas`.
- v0.2: menambah nama dan identitas visual, aturan honor otomatis, jendela absen, dashboard per peran, rincian keuangan dan ujian CBT dari spesifikasi asli beta; membagi menjadi Fase 1 dan Fase 2.
- v0.1: draft awal.
