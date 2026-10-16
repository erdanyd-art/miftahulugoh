# docs/security-checklist.md — Daftar Periksa Keamanan Fase 1

Versi: 0.1 · Tanggal: 2026-10-14

Cara pakai: setiap butir diberi status **Lulus / Gagal / Ditunda** beserta bukti (perintah, hasil tes, tangkapan layar, atau tautan PR). Jangan menandai Lulus tanpa bukti. Kolom "Sprint" menunjukkan kapan butir mulai wajib diperiksa; semuanya diperiksa ulang penuh di Sprint 7 dan sebelum Sprint 8 selesai.

Bukti "Supabase lokal" = `npx supabase test db` / Playwright di Supabase lokal (Docker) dengan seed fiktif, 2026-10-15. Produksi diperiksa ulang di Sprint 8.

Prinsip dasar: **keamanan ada di database dan server, bukan di antarmuka.** Menyembunyikan menu, halaman, atau tombol bukan pengamanan.

## A. Autentikasi dan sesi

| # | Butir | Sprint | Status |
|---|---|---|---|
| A1 | Pendaftaran publik dimatikan (lokal dan produksi) | 2, 8 | Lulus — lokal `enable_signup=false`; produksi `disable_signup=true` (Management API, 2026-10-16) |
| A2 | Tidak ada kata sandi bawaan atau bersama; pengguna menetapkan kata sandi sendiri lewat undangan/reset | 3 | Lulus — admin mengundang lewat email; pengguna membuat sandi sendiri via tautan (E2E `pengguna.spec.ts`); tidak ada sandi bawaan |
| A3 | Hash kata sandi lama dari Google Sheets tidak dimigrasi | 1 | Lulus — tidak ada impor data maupun hash dari Sheets (schema.md §12) |
| A4 | Kebijakan kata sandi minimum (panjang ≥ 10) diatur di Supabase Auth | 2, 8 | Lulus — lokal `minimum_password_length=10`; produksi `password_min_length=10` (2026-10-16) + Zod |
| A5 | URL pengalihan (redirect) Auth hanya mengizinkan domain sendiri dan localhost untuk pengembangan | 8 | Lulus — produksi `site_url=https://miftahulugohh.vercel.app`, `uri_allow_list=https://miftahulugohh.vercel.app/**` (2026-10-16); lokal hanya localhost. Ganti ke domain sendiri bila domain dipasang |
| A6 | Pengguna nonaktif tidak bisa masuk dan sesi yang sedang berjalan kehilangan akses (diuji) | 2, 3 | Lulus — E2E: tutor nonaktif ditolak saat masuk; admin menonaktifkan tutor yang sedang login → navigasi berikutnya ditolak; login diblokir (ban Auth); aktif lagi memulihkan |
| A7 | Akun Auth tanpa baris `profiles` aktif tidak punya akses apa pun (diuji) | 2 | Lulus — E2E "akun tanpa profil tidak bisa masuk"; RLS memeriksa `profiles` aktif |
| A8 | Login memakai sesi cookie aman (`@supabase/ssr`); tidak menyimpan token di `localStorage` secara manual | 2 | Lulus — `@supabase/ssr` (cookie); tidak ada `localStorage` di kode |
| A9 | Pesan galat login tidak membocorkan apakah email terdaftar | 2 | Lulus — E2E: pesan sama untuk sandi salah dan email tak terdaftar; lupa sandi selalu pesan sama |
| A10 | (Disarankan) Autentikasi dua faktor TOTP untuk akun admin | 8 | Ditunda (disarankan) — TOTP sudah tersedia di Supabase produksi, tetapi aplikasi belum punya alur daftar/verifikasi TOTP. Keputusan: Erdany + pemilik lembaga. Tinjau: setelah UAT |

## B. Otorisasi dan RLS

| # | Butir | Sprint | Status |
|---|---|---|---|
| B1 | RLS aktif di **semua** tabel `public`; ada tes otomatis yang memeriksanya | 1 | Lulus (Supabase lokal) — `supabase/tests/00_struktur_rls.test.sql` tes 1–2 |
| B2 | Seluruh tes RLS di `supabase/tests/` lulus pada setiap PR | 1+ | Lulus (Supabase lokal) — `npx supabase test db`: Files=2, Tests=74, PASS; job `database` di CI menunggu remote GitHub |
| B3 | Tutor tidak dapat membaca `kas`, `pembayaran`, `kategori_kas`, `audit_log` (diuji) | 1, 6 | Lulus (Supabase lokal) — `01_aturan_bisnis` bagian visibilitas tutor |
| B4 | Tutor hanya melihat jadwal, kelas, peserta, sesi, dan absensi yang terkait dirinya (diuji) | 1, 4, 5 | Lulus (Sprint 1+4) — RLS diuji pgTAP; E2E: tutor 2 tidak melihat jadwal/kelas tutor 1; halaman admin data master → /tidak-berwenang. Sesi/absensi: diuji lagi di Sprint 5 |
| B5 | `sesi` dan `absensi_murid` tidak bisa ditulis langsung oleh pengguna aplikasi; hanya lewat fungsi | 1, 5 | Lulus (Supabase lokal) — INSERT/UPDATE langsung ke `sesi` ditolak |
| B6 | Honor dan jendela absen dihitung/diperiksa di database, bukan di kode aplikasi | 5 | Lulus (Sprint 5) — honor & jendela waktu hanya di `simpan_absensi`; UI hanya menonaktifkan tombol (`sudahMulai`). E2E: hadir 1 → Rp 100.001, hadir 0 → Rp 50.000, koreksi tidak tertimpa, sesi terkunci |
| B7 | Peran pengguna dibaca dari tabel `profiles` di server, bukan dari body request, cookie bebas, atau metadata yang bisa diubah klien | 2 | Lulus — `lib/auth.ts` membaca peran dari `profiles` lewat RLS setelah `getUser()` |
| B8 | Setiap fungsi `SECURITY DEFINER` memakai `set search_path = ''`, nama objek lengkap, memeriksa `auth.uid()`, dan `EXECUTE`-nya dicabut dari `anon` | 1 | Lulus (Supabase lokal) — tes struktural `search_path` + EXECUTE anon; cek `auth.uid()` lewat telaah fungsi. Produksi (2026-10-15): Supabase advisors → fungsi trigger dicabut EXECUTE-nya (migrasi 20261015000003); sisa peringatan lint 0029 hanya 7 RPC yang sengaja dipanggil pengguna login (simpan_absensi, koreksi_honor, kunci_sesi, ubah_meet, saldo_honor, is_admin, peran_saya), masing-masing memeriksa auth.uid()/peran sendiri |
| B9 | Tidak ada kebijakan DELETE untuk data keuangan; DELETE fisik ditolak; hanya soft delete | 1, 6 | Lulus (Supabase lokal) — DELETE fisik `kas`/`pembayaran` ditolak (UI soft delete: Sprint 6) |
| B10 | Tidak ada tabel baru tanpa RLS, kebijakan, dan tes pada PR yang sama | semua | Lulus — migrasi 0006 tanpa tabel baru; tes struktural `00_struktur_rls` gagal otomatis bila ada tabel tanpa RLS/kebijakan |
| B11 | Akses tanpa login (anon) ditolak di semua tabel dan fungsi (diuji) | 1 | Lulus (Supabase lokal) — tes anon + tes struktural fungsi |
| B12 | Percobaan eskalasi (tutor mengubah perannya sendiri, mengubah honor jadwal, menulis kas) gagal (diuji) | 1 | Lulus (Supabase lokal) — ubah peran, honor jadwal, tulis kas gagal |
| B13 | (Fase 2) Peserta hanya membaca profil dan data pesertanya sendiri; tidak bisa memakai fungsi staf; peran peserta tidak bisa diubah ke/dari staf (diuji) | 9 | Lulus (Sprint 9) — `06_akun_peserta.test.sql` (22 tes); celah `simpan_absensi`/`ubah_meet` ("bukan tutor = admin") ditutup sebelum peran ditambahkan; E2E `akun-peserta.spec.ts` |
| B14 | (Fase 2) Kata sandi awal peserta acak per akun, tampil sekali, tidak disimpan/dicatat; wajib diganti saat masuk pertama | 9 | Lulus (Sprint 9) — `lib/aksi-akun-peserta.ts` (`crypto.randomInt`), `/ganti-sandi` dipaksa dari layout. Batasan: peserta yang paham API bisa memanggil `selesai_ganti_sandi()` tanpa mengganti sandi; dampaknya hanya pada akunnya sendiri |
| B15 | (Fase 2) Kunci jawaban (`soal_kunci`) hanya terbaca/tertulis admin; tutor, peserta, anon tidak bisa (diuji) | 10 | Lulus (Sprint 10) — `07_ujian.test.sql` (27 tes): RLS admin-only, anon `permission denied`, peserta UPDATE tidak berdampak |
| B16 | (Fase 2) Audio ujian di bucket **privat**; unggah/baca/hapus hanya admin (kebijakan `storage.objects`); batas 10 MB & jenis mp3/m4a ditegakkan bucket; path harus di folder ujiannya | 10 | Lulus (Sprint 10) — `07_ujian.test.sql` (tutor ditolak unggah), constraint `audio_path_valid`; E2E unggah lewat tautan sekali pakai tanpa galat CSP |

## C. Rahasia dan konfigurasi

| # | Butir | Sprint | Status |
|---|---|---|---|
| C1 | `service_role` hanya ada di variabel lingkungan server; tidak berawalan `NEXT_PUBLIC_`; tidak ada di bundel klien (cari di `.next/static`) | 3 | Lulus — kunci hanya di `lib/supabase/admin.ts` (`server-only`); build 2026-10-15: nilai kunci & nama `SERVICE_ROLE` = 0 berkas di `.next/static` |
| C2 | `.env*` di `.gitignore`; hanya `.env.example` tanpa nilai asli yang di-commit | 0 | Lulus — `.env*` + `!.env.example` di `.gitignore`; `git check-ignore .env.local` cocok |
| C3 | Pemindaian rahasia pada riwayat Git (misalnya `gitleaks`) bersih | 7 | Lulus (Sprint 7) — gitleaks (Docker) atas 15 commit: "no leaks found"; pemindaian manual kunci/JWT: 0 |
| C4 | Variabel lingkungan produksi diisi di Vercel, bukan di repositori | 8 | Lulus — variabel diisi di Vercel (aplikasi produksi berjalan); repositori hanya berisi `.env.example` (`git ls-files`, 2026-10-16) |
| C5 | Kunci dan kata sandi tidak muncul di log, galat yang tampil ke pengguna, atau pesan commit | 7 | Lulus (Sprint 7) — 0 `console.*` di kode; galat ke pengguna memakai pesan tetap berbahasa Indonesia (tanpa `error.message` mentah); 0 kunci di pesan commit |
| C6 | Proyek Supabase produksi terpisah dari pengembangan; seed fiktif tidak dijalankan di produksi | 8 | Lulus — produksi `neqvbfwccaxlaauzjmmm` terpisah dari lokal; 0 akun `@contoh.test` di produksi (query 2026-10-16) |

## D. Validasi input dan aplikasi web

| # | Butir | Sprint | Status |
|---|---|---|---|
| D1 | Semua input divalidasi di server dengan Zod, selain constraint di database | 3+ | Lulus (Sprint 2–3) — Zod di setiap server action (`lib/validasi/`), ID divalidasi `z.guid()`; constraint/trigger di database |
| D2 | Semua akses data memakai query berparameter melalui klien Supabase; tidak ada SQL yang dirangkai dari input pengguna | 3+ | Lulus (Sprint 2–3) — hanya klien Supabase (query berparameter); tidak ada SQL dirangkai di aplikasi |
| D3 | Rute dan server action memeriksa autentikasi **dan** peran di server | 2+ | Lulus (Sprint 2) — halaman memanggil `penggunaWajib`/`wajibPeran`; E2E tutor → `/tidak-berwenang` di /keuangan, /pembayaran, /pengguna |
| D4 | Teks Arab/RTL dan karakter khusus dirender tanpa `dangerouslySetInnerHTML` dari input pengguna | 4+ | Lulus (Sprint 4) — tidak ada `dangerouslySetInnerHTML` di kode; teks pengguna dirender React (di-escape) |
| D5 | Ekspor CSV mencegah injeksi formula (sel berawalan `=`, `+`, `-`, `@` diberi tanda petik) | 6 | Lulus — `lib/csv.ts` memberi tanda petik pada sel teks berawalan = + - @ tab CR (tes unit); E2E memastikan `=HYPERLINK(...)` keluar sebagai `'=HYPERLINK(...)` |
| D6 | Tautan Meet hanya menerima `https://` (constraint database + validasi form); dibuka dengan `rel="noopener noreferrer"` | 4 | Lulus — constraint `^https://` di database + Zod `skemaMeet` + E2E (http:// ditolak); tautan dibuka `target=_blank rel="noopener noreferrer"` |
| D7 | Header keamanan di `next.config`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, HSTS di produksi | 7, 8 | Lulus (lokal, Sprint 7) — `next.config.ts`: CSP (frame-ancestors none, object-src none, form-action self), nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy; diuji E2E. HSTS & upgrade-insecure-requests hanya `VERCEL_ENV=production` → verifikasi Sprint 8. Catatan: script-src memakai `unsafe-inline` (tanpa nonce) — diterima karena tanpa dangerouslySetInnerHTML |
| D8 | Server action/route yang mengubah data hanya menerima metode dan asal yang semestinya (perlindungan CSRF bawaan tidak dimatikan) | 3+ | Lulus (Sprint 2) — server action Next.js bawaan (POST + cek Origin), tidak dimatikan |
| D9 | Pembatasan percobaan masuk (rate limit) aktif: periksa pengaturan bawaan Supabase Auth dan sesuaikan | 8 | Lulus — batas bawaan Supabase aktif di produksi: email 30/jam, verify 30, OTP 30, token refresh 150 per 5 menit per IP; rotasi refresh token aktif; pendaftaran & anonim mati (2026-10-16). Cukup untuk lembaga kecil |
| D10 | Galat tak terduga menampilkan pesan umum ke pengguna; rincian hanya di log server | 7 | Lulus (Sprint 7) — `app/error.tsx` & `app/global-error.tsx` menampilkan pesan umum + kode referensi; Next menyembunyikan rincian galat server di produksi |

## E. Data, audit, dan cadangan

| # | Butir | Sprint | Status |
|---|---|---|---|
| E1 | `audit_log` mencatat perubahan `profiles`, `jadwal`, `sesi`, `kas`, `pembayaran` beserta pelakunya | 1, 7 | Lulus (Sprint 7) — `03_audit.test.sql`: trigger di profiles, jadwal, sesi, kas, pembayaran, pengaturan; nilai sebelum/sesudah & pelaku tercatat |
| E2 | `audit_log` tidak bisa diubah atau dihapus pengguna aplikasi (diuji) | 1 | Lulus (Supabase lokal) — UPDATE `audit_log` ditolak |
| E3 | Halaman Audit hanya untuk admin | 7 | Lulus (Sprint 7) — `/audit` memanggil `wajibPeran("admin")` + RLS `audit_log_baca`; E2E tutor → /tidak-berwenang |
| E4 | Soft delete dihormati di semua query, rekap, saldo honor, dan ekspor | 6 | Lulus (Sprint 6) — setiap query kas/pembayaran menyaring `dihapus_pada is null` (daftar, rekap, ekspor, dashboard); `saldo_honor()` juga; E2E: baris dihapus tidak muncul di daftar maupun CSV |
| E5 | Cadangan terjadwal aktif dan **satu latihan pemulihan berhasil**; langkahnya tertulis di `docs/operasional.md` | 7, 8 | Lulus — `npm run cadangan` (data public+auth, di luar repo); latihan pemulihan cadangan produksi ke database uji 2026-10-16: 13/13 tabel sama, saldo kas sama (`docs/operasional.md` §1.3, §4). Jadwal: mingguan oleh Erdany |
| E6 | Data fiktif dan data nyata tidak bercampur; data nyata tidak masuk repositori, tangkapan layar, atau fixture tes | semua | Lulus (Sprint 7) — seed/tes hanya domain `contoh.test`/`uji.test`; tidak ada data nyata atau tangkapan layar di repositori (repositori publik) |
| E7 | `peserta.catatan` terlihat tutor kelas terkait: keputusan tertulis (dibiarkan dengan pedoman "jangan isi hal sensitif", atau dipisah ke tabel khusus admin) | 4 | Keputusan (Sprint 4, perlu dikonfirmasi pemilik lembaga): catatan dibiarkan di `peserta` dengan pedoman tertulis di form "jangan isi hal sensitif"; UI tutor tidak menampilkan catatan. Tinjau ulang sebelum data nyata masuk (Sprint 8) |

## F. Dependensi dan operasional

| # | Butir | Sprint | Status |
|---|---|---|---|
| F1 | `npm audit` tidak memiliki temuan tinggi/kritis yang belum ditangani | 7 | Lulus (keputusan tertulis, Sprint 7) — `npm audit --omit=dev`: 0. Dev-only: 9 "high" dari `braces` (DoS glob) lewat CLI shadcn & eslint-config-next, tidak ikut ke aplikasi; perbaikan butuh versi mayor. Tinjau saat Dependabot menawarkan pembaruan |
| F2 | Pembaruan dependensi otomatis (Dependabot atau setara) aktif | 0 | Lulus — Dependabot aktif: PR otomatis `actions/checkout`, `actions/setup-node`, npm (2026-10-15) |
| F3 | Dependensi baru dicatat dan dikonfirmasi sebelum dipasang | semua | Lulus (Sprint 0–1) — dependensi tercantum di rencana Sprint 0 dan disetujui |
| F4 | CI menjalankan lint, typecheck, tes unit, dan tes database pada setiap PR | 0+ | Lulus — CI (lint, typecheck, unit, build, `supabase test db`, E2E) hijau di PR #7 (2026-10-15) |
| F5 | Domain memakai HTTPS penuh; HTTP dialihkan ke HTTPS | 8 | Sebagian — `miftahulugohh.vercel.app`: HTTP → 308 ke HTTPS, HSTS `max-age=63072000; preload` (2026-10-16). Domain sendiri belum ada; periksa ulang saat dipasang |
| F6 | Tertulis siapa pemilik akun GitHub, Supabase, Vercel, dan domain, serta cara pemulihan aksesnya | 8 | Lulus — `docs/operasional.md` §3 |
| F7 | Log Vercel/Supabase dapat diakses dan ada penanggung jawab yang memeriksanya | 8 | Lulus — `docs/operasional.md` §3 (Erdany memeriksa log mingguan) |

## G. Penerimaan sebelum data nyata masuk

Status per 2026-10-16 (produksi). Data nyata boleh masuk; tersisa A10 (TOTP, disarankan) dan domain sendiri (F5).

- [x] A1, A2, A6, A7 — Lulus (A1 juga di produksi)
- [x] B1 sampai B12 — semua Lulus (diuji di Supabase lokal dan CI)
- [x] C1, C2, C4, C6 — Lulus
- [x] E1, E5 — Lulus (latihan pemulihan cadangan produksi 2026-10-16)
- [ ] F5 — HTTPS di vercel.app Lulus; domain sendiri belum

Butir yang Ditunda wajib punya alasan tertulis, pemilik keputusan, dan tanggal tinjau ulang.
