# docs/security-checklist.md — Daftar Periksa Keamanan Fase 1

Versi: 0.1 · Tanggal: 2026-10-14

Cara pakai: setiap butir diberi status **Lulus / Gagal / Ditunda** beserta bukti (perintah, hasil tes, tangkapan layar, atau tautan PR). Jangan menandai Lulus tanpa bukti. Kolom "Sprint" menunjukkan kapan butir mulai wajib diperiksa; semuanya diperiksa ulang penuh di Sprint 7 dan sebelum Sprint 8 selesai.

Prinsip dasar: **keamanan ada di database dan server, bukan di antarmuka.** Menyembunyikan menu, halaman, atau tombol bukan pengamanan.

## A. Autentikasi dan sesi

| # | Butir | Sprint | Status |
|---|---|---|---|
| A1 | Pendaftaran publik dimatikan (lokal dan produksi) | 2, 8 | ☐ |
| A2 | Tidak ada kata sandi bawaan atau bersama; pengguna menetapkan kata sandi sendiri lewat undangan/reset | 3 | ☐ |
| A3 | Hash kata sandi lama dari Google Sheets tidak dimigrasi | 1 | ☐ |
| A4 | Kebijakan kata sandi minimum (panjang ≥ 10) diatur di Supabase Auth | 2, 8 | ☐ |
| A5 | URL pengalihan (redirect) Auth hanya mengizinkan domain sendiri dan localhost untuk pengembangan | 8 | ☐ |
| A6 | Pengguna nonaktif tidak bisa masuk dan sesi yang sedang berjalan kehilangan akses (diuji) | 2, 3 | ☐ |
| A7 | Akun Auth tanpa baris `profiles` aktif tidak punya akses apa pun (diuji) | 2 | ☐ |
| A8 | Login memakai sesi cookie aman (`@supabase/ssr`); tidak menyimpan token di `localStorage` secara manual | 2 | ☐ |
| A9 | Pesan galat login tidak membocorkan apakah email terdaftar | 2 | ☐ |
| A10 | (Disarankan) Autentikasi dua faktor TOTP untuk akun admin | 8 | ☐ |

## B. Otorisasi dan RLS

| # | Butir | Sprint | Status |
|---|---|---|---|
| B1 | RLS aktif di **semua** tabel `public`; ada tes otomatis yang memeriksanya | 1 | ☐ |
| B2 | Seluruh tes RLS di `supabase/tests/` lulus pada setiap PR | 1+ | ☐ |
| B3 | Tutor tidak dapat membaca `kas`, `pembayaran`, `kategori_kas`, `audit_log` (diuji) | 1, 6 | ☐ |
| B4 | Tutor hanya melihat jadwal, kelas, peserta, sesi, dan absensi yang terkait dirinya (diuji) | 1, 4, 5 | ☐ |
| B5 | `sesi` dan `absensi_murid` tidak bisa ditulis langsung oleh pengguna aplikasi; hanya lewat fungsi | 1, 5 | ☐ |
| B6 | Honor dan jendela absen dihitung/diperiksa di database, bukan di kode aplikasi | 5 | ☐ |
| B7 | Peran pengguna dibaca dari tabel `profiles` di server, bukan dari body request, cookie bebas, atau metadata yang bisa diubah klien | 2 | ☐ |
| B8 | Setiap fungsi `SECURITY DEFINER` memakai `set search_path = ''`, nama objek lengkap, memeriksa `auth.uid()`, dan `EXECUTE`-nya dicabut dari `anon` | 1 | ☐ |
| B9 | Tidak ada kebijakan DELETE untuk data keuangan; DELETE fisik ditolak; hanya soft delete | 1, 6 | ☐ |
| B10 | Tidak ada tabel baru tanpa RLS, kebijakan, dan tes pada PR yang sama | semua | ☐ |
| B11 | Akses tanpa login (anon) ditolak di semua tabel dan fungsi (diuji) | 1 | ☐ |
| B12 | Percobaan eskalasi (tutor mengubah perannya sendiri, mengubah honor jadwal, menulis kas) gagal (diuji) | 1 | ☐ |

## C. Rahasia dan konfigurasi

| # | Butir | Sprint | Status |
|---|---|---|---|
| C1 | `service_role` hanya ada di variabel lingkungan server; tidak berawalan `NEXT_PUBLIC_`; tidak ada di bundel klien (cari di `.next/static`) | 3 | ☐ |
| C2 | `.env*` di `.gitignore`; hanya `.env.example` tanpa nilai asli yang di-commit | 0 | ☐ |
| C3 | Pemindaian rahasia pada riwayat Git (misalnya `gitleaks`) bersih | 7 | ☐ |
| C4 | Variabel lingkungan produksi diisi di Vercel, bukan di repositori | 8 | ☐ |
| C5 | Kunci dan kata sandi tidak muncul di log, galat yang tampil ke pengguna, atau pesan commit | 7 | ☐ |
| C6 | Proyek Supabase produksi terpisah dari pengembangan; seed fiktif tidak dijalankan di produksi | 8 | ☐ |

## D. Validasi input dan aplikasi web

| # | Butir | Sprint | Status |
|---|---|---|---|
| D1 | Semua input divalidasi di server dengan Zod, selain constraint di database | 3+ | ☐ |
| D2 | Semua akses data memakai query berparameter melalui klien Supabase; tidak ada SQL yang dirangkai dari input pengguna | 3+ | ☐ |
| D3 | Rute dan server action memeriksa autentikasi **dan** peran di server | 2+ | ☐ |
| D4 | Teks Arab/RTL dan karakter khusus dirender tanpa `dangerouslySetInnerHTML` dari input pengguna | 4+ | ☐ |
| D5 | Ekspor CSV mencegah injeksi formula (sel berawalan `=`, `+`, `-`, `@` diberi tanda petik) | 6 | ☐ |
| D6 | Tautan Meet hanya menerima `https://` (constraint database + validasi form); dibuka dengan `rel="noopener noreferrer"` | 4 | ☐ |
| D7 | Header keamanan di `next.config`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, HSTS di produksi | 7, 8 | ☐ |
| D8 | Server action/route yang mengubah data hanya menerima metode dan asal yang semestinya (perlindungan CSRF bawaan tidak dimatikan) | 3+ | ☐ |
| D9 | Pembatasan percobaan masuk (rate limit) aktif: periksa pengaturan bawaan Supabase Auth dan sesuaikan | 8 | ☐ |
| D10 | Galat tak terduga menampilkan pesan umum ke pengguna; rincian hanya di log server | 7 | ☐ |

## E. Data, audit, dan cadangan

| # | Butir | Sprint | Status |
|---|---|---|---|
| E1 | `audit_log` mencatat perubahan `profiles`, `jadwal`, `sesi`, `kas`, `pembayaran` beserta pelakunya | 1, 7 | ☐ |
| E2 | `audit_log` tidak bisa diubah atau dihapus pengguna aplikasi (diuji) | 1 | ☐ |
| E3 | Halaman Audit hanya untuk admin | 7 | ☐ |
| E4 | Soft delete dihormati di semua query, rekap, saldo honor, dan ekspor | 6 | ☐ |
| E5 | Cadangan terjadwal aktif dan **satu latihan pemulihan berhasil**; langkahnya tertulis di `docs/operasional.md` | 7, 8 | ☐ |
| E6 | Data fiktif dan data nyata tidak bercampur; data nyata tidak masuk repositori, tangkapan layar, atau fixture tes | semua | ☐ |
| E7 | `peserta.catatan` terlihat tutor kelas terkait: keputusan tertulis (dibiarkan dengan pedoman "jangan isi hal sensitif", atau dipisah ke tabel khusus admin) | 4 | ☐ |

## F. Dependensi dan operasional

| # | Butir | Sprint | Status |
|---|---|---|---|
| F1 | `npm audit` tidak memiliki temuan tinggi/kritis yang belum ditangani | 7 | ☐ |
| F2 | Pembaruan dependensi otomatis (Dependabot atau setara) aktif | 0 | ☐ |
| F3 | Dependensi baru dicatat dan dikonfirmasi sebelum dipasang | semua | ☐ |
| F4 | CI menjalankan lint, typecheck, tes unit, dan tes database pada setiap PR | 0+ | ☐ |
| F5 | Domain memakai HTTPS penuh; HTTP dialihkan ke HTTPS | 8 | ☐ |
| F6 | Tertulis siapa pemilik akun GitHub, Supabase, Vercel, dan domain, serta cara pemulihan aksesnya | 8 | ☐ |
| F7 | Log Vercel/Supabase dapat diakses dan ada penanggung jawab yang memeriksanya | 8 | ☐ |

## G. Penerimaan sebelum data nyata masuk

Semua butir berikut harus Lulus sebelum data murid atau keuangan sungguhan dimasukkan:

- [ ] A1, A2, A6, A7
- [ ] B1 sampai B12
- [ ] C1, C2, C4, C6
- [ ] E1, E5
- [ ] F5

Butir yang Ditunda wajib punya alasan tertulis, pemilik keputusan, dan tanggal tinjau ulang.
