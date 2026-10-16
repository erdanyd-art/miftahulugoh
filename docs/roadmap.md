# docs/roadmap.md — Roadmap Implementasi Fase 1

Versi: 0.1 · Tanggal: 2026-10-14 · Acuan: PRD.md v0.4 (Sprint 2b: v0.10), docs/schema.md, CLAUDE.md, docs/security-checklist.md

Delapan sprint kecil (Sprint 0–8), ditambah Sprint 2b untuk landing page. Satu sprint = satu cabang Git = satu Pull Request. Jangan mulai sprint berikutnya sebelum sprint sebelumnya memenuhi "Kriteria selesai" dan disetujui.

## Cara memakai dengan Claude Code

Letakkan berkas di repositori:

```
CLAUDE.md                   (root)
PRD.md                      (root)
docs/schema.md
docs/roadmap.md             (berkas ini)
docs/security-checklist.md
docs/uji_rls.sql            (bahan tes RLS; diubah menjadi pgTAP di Sprint 1)
docs/landing-page.md        (spesifikasi landing page; Sprint 2b)
docs/landing-reference.html (acuan visual landing page; buka di browser)
```

**Prompt pembuka sesi (tempel di Claude Code sekali di awal):**

> Baca CLAUDE.md, PRD.md, docs/schema.md, docs/roadmap.md, dan docs/security-checklist.md. Kita mengerjakan Fase 1 per sprint. Jangan menulis kode dulu. Ringkas pemahamanmu dalam 10 baris, sebutkan hal yang belum jelas, lalu tunggu aba-aba untuk Sprint 0.

**Prompt per sprint:** gunakan blok "Prompt" di setiap sprint di bawah. Polanya selalu: rencana dulu, tunggu persetujuan, baru kerjakan.

## Aturan lintas sprint

- Cabang `sprint-N-nama`. Commit kecil. PR memuat ringkasan, daftar yang diuji, dan hal yang sengaja ditunda.
- **Definition of done** setiap sprint: `npm run lint`, `npm run typecheck`, `npm test`, dan `supabase test db` hijau; tidak ada rahasia di Git; kriteria selesai sprint terpenuhi; bagian terkait di `docs/security-checklist.md` dicentang.
- Perubahan skema hanya lewat migrasi. Setiap tabel baru = RLS + tes dalam perubahan yang sama.
- Jika kebutuhan tidak jelas atau bertentangan dengan PRD, **berhenti dan tanya**.
- Dilarang: mengerjakan Fase 2 (peserta login, ujian), menambah dependensi tanpa konfirmasi, mematikan RLS "sementara".

## Strategi pengujian

| Lapisan | Alat (usulan) | Isi |
|---|---|---|
| Database | pgTAP lewat `supabase test db` | Semua skenario di `docs/uji_rls.sql`, diubah ke pgTAP; tes baru untuk setiap tabel/fungsi baru |
| Unit | Vitest | Skema Zod, fungsi format rupiah/tanggal/hari, pemetaan pesan error |
| E2E | Playwright | Alur inti per peran (lihat Sprint 7) |
| Manual | Daftar periksa UAT | Dilakukan bersama teman pemilik lembaga (Sprint 8) |

---

## Sprint 0 — Fondasi proyek

**Tujuan:** proyek kosong yang bisa dijalankan, dites, dan di-deploy tanpa fitur.

**Tugas**
1. Buat repositori GitHub privat. Scaffold Next.js (App Router) + TypeScript strict.
2. Pasang Tailwind dan shadcn/ui, Zod, Vitest. (Usulan: konfirmasi dulu sebelum dipasang.)
3. `supabase init`; `supabase start` jalan lokal. Tambahkan `.env.example` tanpa nilai asli; `.env*` di `.gitignore`.
4. Skrip `lint`, `typecheck`, `test`, `build`. GitHub Actions menjalankan keempatnya pada setiap PR.
5. Design token biru tua sebagai CSS variable/tema Tailwind (lihat bagian Tampilan di CLAUDE.md). Kerangka layout kosong: sidebar + header, responsif.
6. Isi bagian "Perintah" di CLAUDE.md dengan perintah yang benar-benar ada.

**Kriteria selesai:** `npm run dev` menampilkan kerangka berwarna biru tua yang responsif; CI hijau; `supabase start` berhasil; tidak ada rahasia di repositori.

**Prompt:** "Kerjakan Sprint 0 dari docs/roadmap.md. Buat rencana dulu, sebutkan dependensi yang akan dipasang, dan tunggu persetujuan saya."

---

## Sprint 1 — Database dan tes RLS

**Tujuan:** skema Fase 1 ada di database lokal, terlindungi RLS, dan teruji.

**Tugas**
1. Buat lima file migrasi dari bagian 6 `docs/schema.md` (0001–0005), **tanpa mengubah isi** kecuali diminta; beri awalan timestamp sesuai Supabase CLI.
2. Ubah skenario di `docs/uji_rls.sql` menjadi tes pgTAP di `supabase/tests/`. Bagian "lingkungan tiruan" tidak dipakai (Supabase lokal sudah punya peran dan `auth`).
3. `supabase/seed.sql` berisi data **fiktif** untuk pengembangan (1 admin, 2 tutor, beberapa kelas/peserta/jadwal). Tidak ada data nyata.
4. Hasilkan tipe TypeScript: `supabase gen types typescript --local`.
5. Jalankan `supabase db reset` dan `supabase test db`.

**Kriteria selesai:** reset bersih; seluruh tes lulus (setara 70 skenario); tidak ada tabel tanpa RLS (tambahkan satu tes yang memeriksa `pg_tables.rowsecurity` untuk semua tabel di `public`); tipe TS ter-commit.

**Prompt:** "Kerjakan Sprint 1 dari docs/roadmap.md. Salin SQL dari docs/schema.md apa adanya ke migrasi. Laporkan hasil `supabase test db` apa adanya, termasuk yang gagal."

---

## Sprint 2 — Autentikasi dan kerangka per peran

**Tujuan:** pengguna bisa masuk dan melihat menu sesuai perannya.

**Tugas**
1. Login email + kata sandi, logout, lupa/atur ulang kata sandi (Supabase Auth, `@supabase/ssr`).
2. Middleware: halaman terproteksi mengarahkan ke login. Peran dibaca dari tabel `profiles` (bukan dari data klien). Akun tanpa profil aktif ditolak dengan pesan jelas.
3. Layout per peran: menu admin dan tutor sesuai CLAUDE.md; ponsel memakai menu geser/navigasi bawah. Halaman "tidak berwenang" untuk akses terlarang.
4. Dokumentasikan langkah membuat admin pertama (bagian 8 `docs/schema.md`) di README.
5. Pendaftaran publik dimatikan di konfigurasi Auth (`supabase/config.toml` untuk lokal).

**Kriteria selesai:** admin dan tutor seed bisa masuk dan melihat menu masing-masing; tutor yang mengetik URL halaman admin ditolak; pengguna nonaktif tidak bisa masuk; E2E dasar (login tiga kondisi) lulus.

**Prompt:** "Kerjakan Sprint 2 dari docs/roadmap.md. Peran harus berasal dari database. Jangan mengandalkan menyembunyikan menu sebagai pengaman."

---

## Sprint 2b — Landing page publik (selesai 2026-10-16)

Catatan implementasi: dashboard tidak diubah. Pengunjung yang belum masuk melihat landing di `/` (rewrite di `proxy.ts` ke `app/landing`); pengguna yang sudah masuk tetap melihat dashboard di `/`.

**Tujuan:** halaman `/` yang sesuai desain yang sudah disetujui, dengan tombol Daftar (WhatsApp) dan Masuk (`/masuk`). Tidak menyentuh database. Bisa dikerjakan setelah Sprint 2 (rute `/masuk` sudah ada); tidak menghalangi sprint lain.

**Tugas**
1. Baca `docs/landing-page.md`; buka `docs/landing-reference.html` di browser sebagai acuan visual. Buat rencana komponen dulu.
2. Token warna, radius, dan font sebagai tema (bukan hex di komponen); font lewat `next/font` (Bricolage Grotesque dan Amiri), di-*host* sendiri.
3. Komponen di `components/landing/` (Server Component, tanpa JavaScript klien); ilustrasi SVG di `components/landing/art/`; teks sesuai spesifikasi.
4. `lib/site-content.ts` untuk kontak, jadwal, dan biaya: kosong → placeholder bergaris putus-putus; terisi → nilai asli dan tautan `wa.me`.
5. Metadata SEO, `robots.ts`, `sitemap.ts` (hanya `/`); `/masuk` dan halaman dashboard `noindex`.
6. Tangkapan layar Playwright di 360, 390, 768, 1024, dan 1440 px; bandingkan dengan acuan dan laporkan perbedaan.
7. Ukur Lighthouse mobile dan kontras warna.

**Kriteria selesai:** lihat bagian 9 `docs/landing-page.md`; butir "G. Halaman publik" di `docs/security-checklist.md` terisi dengan bukti; lint, typecheck, dan tes hijau.

**Prompt:** "Kerjakan Sprint 2b dari docs/roadmap.md. Baca docs/landing-page.md dan buka docs/landing-reference.html sebagai acuan visual. Buat rencana dulu dan tunggu persetujuan saya. Bandingkan hasil dengan acuan lewat tangkapan layar di 360, 390, 768, 1024, dan 1440 px. Jangan mengarang nomor kontak, harga, atau testimoni; biarkan placeholder."

---

## Sprint 3 — Pengguna dan Pengaturan (admin)

**Tujuan:** admin mengelola akun tutor dan zona waktu lembaga.

**Tugas**
1. Halaman Pengguna: daftar, tambah (undang lewat email atau buat akun), ubah nama/peran, nonaktifkan/aktifkan. **Tidak ada hapus permanen.**
2. Pembuatan akun lewat route handler/server action yang memakai `service_role` **hanya di server**; periksa dulu bahwa pemanggilnya admin aktif. Kunci `service_role` tidak pernah masuk bundel klien.
3. Halaman Pengaturan: nama lembaga dan zona waktu. Validasi zona waktu sebagai nama IANA yang valid (zona salah membuat tutor gagal absen; lihat risiko di `docs/schema.md`).

**Kriteria selesai:** admin menambah tutor dan tutor itu bisa masuk dan menetapkan kata sandi sendiri; menonaktifkan tutor langsung memutus aksesnya; zona waktu tidak valid ditolak; periksa bahwa `service_role` tidak ada di hasil build klien (cari di `.next/static`).

**Prompt:** "Kerjakan Sprint 3 dari docs/roadmap.md. Tunjukkan di rencana di mana tepatnya `service_role` dipakai dan bagaimana dipastikan hanya di server."

---

## Sprint 4 — Data master: Peserta, Kelas, Jadwal

**Tujuan:** admin mengelola data inti; tutor melihat miliknya.

**Tugas**
1. **Peserta (admin):** daftar dengan cari, filter aktif/nonaktif, pagination; tambah, ubah, nonaktifkan.
2. **Kelas (admin):** CRUD; kelola anggota kelas (tambah/keluarkan peserta).
3. **Jadwal (admin):** CRUD (kelas, tutor, hari, jam, honor, tautan Meet); validasi jam; tampilkan nama hari dari angka ISO (1 = Senin ... 7 = Ahad).
4. **Tutor:** halaman Jadwal Saya dan Kelas Saya (baca saja) dan tombol ubah tautan Meet yang memanggil `ubah_meet`.
5. Semua tabel: cari, filter, urut, pagination (server-side).

**Kriteria selesai:** admin dapat melakukan seluruh CRUD; tutor hanya melihat jadwal, kelas, dan peserta miliknya (diuji E2E dan lewat tes RLS yang sudah ada); tutor hanya bisa mengubah tautan Meet.

**Prompt:** "Kerjakan Sprint 4 dari docs/roadmap.md. Semua penulisan data oleh tutor harus lewat fungsi database yang sudah ada; jangan menambah kebijakan tulis untuk tutor."

---

## Sprint 5 — Absensi dan honor (inti produk)

**Tujuan:** tutor absen dengan benar; honor terhitung otomatis; admin memantau.

**Tugas**
1. **Dashboard tutor:** jadwal aktif hari ini; tombol Absen aktif hanya setelah jam mulai (cerminkan aturan database; **penegakan tetap di database**).
2. **Form absen per murid:** daftar anggota aktif kelas, tandai hadir; kirim ke `simpan_absensi`. Tampilkan hasil (hadir/total, honor) dan petakan pesan error database ke bahasa yang ramah ("belum waktunya absen", "sesi sudah dikunci", dan seterusnya).
3. **Dashboard admin:** semua jadwal hari ini dengan status (belum absen / sudah, hadir dari total). Admin dapat membuka sesi dan mengoreksi absensi (termasuk tanggal lampau), `koreksi_honor`, `kunci_sesi`.
4. **Honor:** halaman Honor Saya (tutor) dan Honor (admin): riwayat sesi, total per bulan, dan **saldo** lewat `saldo_honor()`.
5. Waktu "hari ini" mengikuti zona waktu lembaga dari `pengaturan`, bukan jam perangkat.

**Kriteria selesai:** kasus hadir ≥ 1 (honor penuh), hadir 0 (setengah), simpan ulang, absen di luar jendela (ditolak), sesi terkunci, dan koreksi admin semuanya teruji E2E dan di database; tutor tidak melihat sesi tutor lain; layar absen nyaman di ponsel.

**Prompt:** "Kerjakan Sprint 5 dari docs/roadmap.md. Jangan menghitung honor atau memvalidasi jendela waktu di kode aplikasi; panggil fungsi database. UI boleh mencerminkan aturan hanya untuk menonaktifkan tombol."

---

## Sprint 6 — Keuangan (admin)

**Tujuan:** pencatatan dan rekap keuangan yang rapi.

**Tugas**
1. **Kategori kas:** daftar dan tambah/nonaktifkan kategori.
2. **Kas:** CRUD pemasukan/pengeluaran; kategori "Honor Tutor" wajib memilih tutor. **Soft delete** (`dihapus_pada`); semua query menyertakan `dihapus_pada is null`.
3. **Pembayaran peserta:** CRUD, status Lunas/Belum Lunas, filter status/peserta/bulan; soft delete.
4. **Rekap bulanan:** kas, pembayaran, dan honor tutor/pegawai, ditampilkan **terpisah** (asumsi A3). Ekspor CSV untuk kas, pembayaran, dan rekap honor.
5. **Dashboard admin:** kartu pemasukan, pengeluaran, selisih bulan berjalan, jumlah Belum Lunas, dan grafik ringkasan bulanan.

**Kriteria selesai:** tutor tidak dapat mengakses halaman maupun datanya (diuji E2E dan di database); soft delete tidak menampilkan baris terhapus di mana pun (termasuk rekap dan saldo honor); CSV terbuka benar di spreadsheet dan tidak rentan injeksi formula (awali sel berawalan `=`, `+`, `-`, `@` dengan tanda petik).

**Prompt:** "Kerjakan Sprint 6 dari docs/roadmap.md. Data keuangan tidak boleh dihapus fisik. Tunjukkan di rencana bagaimana ekspor CSV mencegah injeksi formula."

---

## Sprint 7 — Audit, hardening, dan pengujian menyeluruh

**Tujuan:** siap diuji pemakai nyata.

**Tugas**
1. **Halaman Audit (admin):** daftar `audit_log` dengan filter tabel/pengguna/tanggal; tampilkan sebelum dan sesudah secara terbaca.
2. Jalankan seluruh `docs/security-checklist.md`; perbaiki temuan. Tandai item yang sengaja ditunda beserta alasannya.
3. **E2E (Playwright)** untuk alur inti: login tiap peran; tutor absen (penuh dan hadir 0); tutor dilarang masuk halaman admin dan keuangan; admin mengoreksi honor dan mengunci sesi; admin mencatat kas dan pembayaran; ekspor CSV.
4. Telaah responsif di ukuran ponsel dan desktop; keadaan kosong, memuat, dan galat di semua halaman; aksesibilitas dasar (kontras, label, fokus keyboard).
5. Latih pencadangan dan pemulihan satu kali (lihat Sprint 8 tugas 4) pada data fiktif.

**Kriteria selesai:** security checklist lengkap; E2E hijau di CI; tidak ada temuan keamanan terbuka tanpa keputusan tertulis.

**Prompt:** "Kerjakan Sprint 7 dari docs/roadmap.md. Jalankan docs/security-checklist.md item demi item dan laporkan statusnya jujur (lulus/gagal/ditunda), jangan menandai lulus tanpa bukti."

---

## Sprint 8 — Deploy dan serah terima

**Tujuan:** berjalan di domain sendiri dengan data nyata yang aman.

**Tugas**
1. Proyek Supabase produksi terpisah dari lokal. Dorong migrasi (`supabase db push`), **jangan** menjalankan seed fiktif di produksi. Buat admin pertama (bagian 8 `docs/schema.md`); matikan pendaftaran publik; atur URL pengalihan Auth yang diizinkan hanya ke domain sendiri; set zona waktu lembaga.
2. Proyek Vercel terhubung ke GitHub. Isi variabel lingkungan di Vercel (bukan di Git): URL dan kunci anon Supabase untuk klien; `service_role` hanya sebagai variabel server.
3. Domain sendiri: sambungkan di Vercel, aktifkan HTTPS; arahkan DNS sesuai petunjuk Vercel.
4. **Cadangan dan pemulihan:** periksa dokumentasi Supabase terbaru tentang cadangan sesuai paket yang dipakai (cadangan otomatis biasanya tergantung paket). Jika tidak memadai, jadwalkan `pg_dump` berkala ke penyimpanan terpisah. **Lakukan satu kali latihan pemulihan** ke database cadangan dan catat langkahnya di `docs/operasional.md`.
5. Pemantauan: log Vercel dan Supabase dapat diakses; tentukan siapa yang memeriksa dan seberapa sering.
6. **UAT** bersama teman: jalankan skenario nyata (tutor absen dari ponsel, admin mencatat keuangan). Kumpulkan catatan; tandai mana yang perbaikan cepat dan mana yang masuk daftar Fase 2.
7. Serah terima: `docs/operasional.md` memuat cara menambah tutor, mengganti kata sandi admin, memulihkan cadangan, dan siapa memegang akun apa.

**Kriteria selesai:** aplikasi hidup di domain sendiri dengan HTTPS; satu latihan pemulihan berhasil; UAT selesai; dokumen operasional ada; tidak ada rahasia di Git atau log.

**Prompt:** "Kerjakan Sprint 8 dari docs/roadmap.md. Untuk setiap langkah yang menyentuh akun Supabase, Vercel, atau DNS saya, berikan instruksi bagi saya untuk dilakukan sendiri dan jangan mengarang nilai atau URL."

---

## Setelah Fase 1

Putuskan bersama teman: portal peserta dan ujian CBT (Fase 2), tagihan SPP otomatis, pengingat WhatsApp, atau pembatasan bentrok jadwal. Jangan dimulai sebelum UAT Fase 1 selesai.

---

## Fase 2 — Ujian CBT (D2, D11, D12, D14)

Mulai setelah Fase 1 terpasang. Tiap sprint = satu cabang/PR, dengan migrasi + RLS + tes pgTAP + E2E.

**Sprint 9 — Login peserta (selesai 2026-10-16).** Peran `peserta` (migrasi enum tersendiri). Admin membuat akun peserta dari halaman Peserta: username + sandi awal acak yang tampil sekali; username dipetakan ke email sintetis yang tidak pernah dikirimi surat. Login pertama wajib ganti sandi; admin dapat mereset sandi peserta. Menu peserta: Beranda, Akun saya (Ujian Saya ditambahkan di Sprint 11). RLS: peserta hanya membaca datanya sendiri.

**Sprint 10 — Menyusun ujian (selesai 2026-10-16).** `ujian` (judul, kelas, jendela mulai–selesai, durasi), `soal` (pilihan ganda/isian, bobot, urutan, teks Arab RTL), `soal_kunci` (tanpa kebijakan baca untuk peserta), `audio_ujian` (bucket Storage privat, mp3/m4a ≤ 10 MB, satu audio untuk beberapa soal).

**Sprint 11 — Mengerjakan (selesai 2026-10-16).** `mulai_ujian()` membuat `percobaan_ujian` dengan `batas_selesai = least(mulai + durasi, ujian.selesai)`; `simpan_jawaban()` menolak setelah batas (database). Simpan otomatis per soal, timer dari server, satu percobaan per peserta. Audio lewat tautan bertanda tangan berumur pendek yang hanya dibuat selama percobaan aktif.

**Sprint 12 — Penilaian (selesai 2026-10-16).** Pilihan ganda dinilai di fungsi database; tutor/admin memeriksa isian; admin "Umumkan nilai"; nilai terbaca peserta (miliknya), tutor (kelasnya), admin (semua); ekspor CSV.

**Sprint 13 — Portal peserta (selesai 2026-10-16; PRD 6.1).** Menu peserta Jadwal Kelas (tombol Google Meet, kelas hari ini juga di Beranda) dan Pembayaran Saya (baca saja), lewat fungsi `jadwal_kelas_saya()` dan `pembayaran_saya()`.
