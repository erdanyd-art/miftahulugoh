# docs/operasional.md — Panduan Operasional

Versi: 0.2 (2026-10-16, produksi)

## 1. Cadangan dan pemulihan

### 1.1 Yang dicadangkan

| Skema | Isi | Catatan |
|---|---|---|
| `public` | Semua data aplikasi: profil, peserta, kelas, jadwal, sesi, absensi, kas, pembayaran, kategori, pengaturan, log audit | Wajib |
| `auth` | Akun login (email, hash kata sandi Supabase) | Wajib, agar pengguna tidak perlu dibuat ulang |

Skema lain (storage, realtime, dll.) tidak dipakai aplikasi ini.

### 1.2 Latihan pemulihan lokal (sudah dilakukan)

Dilakukan pada data **fiktif** di Supabase lokal (Docker). Perintah (dari folder proyek, Docker Desktop menyala):

```bash
export PATH="$HOME/.docker/bin:$PATH" DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
D=supabase_db_miftah-al-lughah

# 1) Cadangkan public + auth (format custom, terkompresi)
docker exec $D pg_dump -U postgres -d postgres -Fc -n public -n auth -f /tmp/cadangan.dump

# 2) Pulihkan ke database baru yang kosong
docker exec $D psql -U postgres -c "drop database if exists latihan_pulih" -c "create database latihan_pulih"
docker exec $D pg_restore -U postgres -d latihan_pulih --no-owner /tmp/cadangan.dump
#    Galat yang boleh diabaikan: 'schema "public" already exists' dan
#    'permission denied to change default privileges' (hak bawaan peran internal Supabase).

# 3) Verifikasi: bandingkan jumlah baris tiap tabel di database asli vs pulihan,
#    pastikan tidak ada tabel tanpa RLS dan fungsi inti ada.
docker exec $D psql -U postgres -d latihan_pulih -c "select count(*) from public.sesi"
docker exec $D psql -U postgres -d latihan_pulih -c "select tablename from pg_tables where schemaname='public' and not rowsecurity"
```

Hasil latihan (lihat bagian 4): jumlah baris 13 tabel sama persis, 0 tabel tanpa RLS, fungsi `simpan_absensi`, `saldo_honor`, `koreksi_honor`, `kunci_sesi`, `ubah_meet` ada.

### 1.3 Produksi

Paket gratis Supabase tidak menyediakan cadangan yang bisa diunduh, jadi cadangan dibuat mandiri.

**Membuat cadangan (mingguan, mis. tiap Jumat):** Docker Desktop menyala, dari folder proyek:

```bash
npm run cadangan
```

Skrip `scripts/cadangan.sh` menjalankan `supabase db dump --linked --data-only --schema public,auth` dan menyimpan
`~/Documents/Cadangan-Miftah/data-YYYY-MM-DD.sql` (folder 700, berkas 600), menyimpan 8 berkas terbaru.
Folder ini **di luar repositori** (repo publik). Berisi data pribadi peserta dan hash kata sandi: jangan dibagikan;
salin juga ke penyimpanan terenkripsi lain (mis. diska eksternal) agar tidak hilang bila laptop rusak.
Struktur database tidak perlu dicadangkan: ada di `supabase/migrations/`.
**Berkas audio ujian (Storage) TIDAK ikut** `npm run cadangan` (hanya data database). Simpan berkas audio asli di
folder lembaga (mis. Google Drive) agar bisa diunggah ulang bila proyek perlu dipulihkan.

**Memulihkan** (ke proyek Supabase baru atau database uji):

1. Proyek kosong, terapkan migrasi: `npx supabase db push --linked` (proyek baru) atau `npx supabase db reset --no-seed` (lokal).
2. Kosongkan baris bawaan migrasi agar tidak bentrok: `truncate public.kategori_kas, public.pengaturan cascade;`
3. Jalankan berkas cadangan dengan `psql` (berkas sudah memuat `session_replication_role = replica`, jadi trigger
   audit dan sinkron kas tidak berjalan dua kali). Lokal:
   `docker cp data-YYYY-MM-DD.sql supabase_db_miftah-al-lughah:/tmp/p.sql && docker exec supabase_db_miftah-al-lughah psql -U postgres -f /tmp/p.sql`
4. Verifikasi: jumlah baris tiap tabel dan saldo kas sama dengan sumber; `select count(*) from pg_tables where schemaname='public' and not rowsecurity` = 0.
5. Proyek baru: isi ulang setelan Auth (Site URL, Redirect URL, SMTP, template email; lihat §3) dan variabel Vercel.
6. Hapus data nyata dari database uji setelah latihan (`npm run db:reset`).

## 2. Tugas rutin admin

- **Memasukkan banyak siswa sekaligus:** menu **Peserta → Impor CSV**. Unduh templat, isi di Excel/Google Sheets, simpan sebagai CSV, unggah, periksa pratinjau, lalu impor. Berkas CSV berisi data siswa: jangan disimpan di repositori.
- **Menambah tutor/admin:** menu **Pengguna → Tambah pengguna**. Pengguna menerima email undangan (dari erdanyd@gmail.com, cek Spam) dan membuat kata sandi sendiri.
- **Pengguna lupa kata sandi:** pengguna klik **Lupa kata sandi?** di halaman masuk, atau admin membuka pengguna lalu **Kirim tautan buat kata sandi**.
- **Akun ujian peserta (Fase 2):** **Peserta → (nama) → Akun ujian**, isi username (huruf kecil/angka/titik), **Buat akun**. Catat username dan kata sandi awal yang tampil (hanya sekali) lalu berikan ke peserta; peserta wajib menggantinya saat masuk. Peserta masuk di halaman yang sama dengan staf, mengetik username (bukan email). Peserta lupa sandi: **Atur ulang kata sandi** di kartu yang sama (peserta tidak punya email). Peserta berhenti: **Nonaktifkan akun**.
- **Menyusun ujian (Fase 2):** menu **Ujian → Buat ujian** (judul, kelas, waktu dibuka–ditutup, durasi). Di halaman ujian: unggah audio (MP3/M4A ≤ 10 MB) bila perlu, **Tambah soal** (pilihan ganda: isi pilihan dan tandai kunci; isian: acuan jawaban untuk pemeriksa), lalu **Terbitkan ujian**. Draf tidak terlihat peserta. Audio yang masih dipakai soal tidak bisa dihapus.
- **Tutor berhenti:** **Pengguna → (nama) → Nonaktifkan akun**. Akses langsung terputus; riwayat absensi dan honor tetap utuh. Jangan menghapus akun di dasbor Supabase.
- **Mengganti kata sandi sendiri (semua peran):** klik avatar/nama di kanan atas → **Akun saya** → isi kata sandi lama dan baru. Lupa kata sandi lama: **Lupa kata sandi?** di halaman masuk.
- **Zona waktu lembaga:** menu **Pengaturan**. Zona salah membuat tutor gagal absen.
- **Sesi absensi perlu dikoreksi:** **Absensi → (sesi) →** koreksi honor / kunci sesi / ubah absensi; semua tercatat di **Audit**.

## 3. Akun, pemantauan, dan penanggung jawab

| Layanan | Akun / lokasi | Pemilik | Catatan pemulihan akses |
|---|---|---|---|
| GitHub | repo `erdanyd-art/miftahulugoh` (publik) | Erdany | Aktifkan 2FA GitHub; simpan kode cadangan |
| Supabase | proyek `neqvbfwccaxlaauzjmmm` (Singapura, paket gratis) | Erdany | Login Supabase dengan akun GitHub/email Erdany; aktifkan 2FA |
| Vercel | proyek `miftahulugohh`, tim `erdanyd-4045's projects` (Hobby), tersambung ke repo di atas | Erdany | Login dengan akun GitHub; variabel lingkungan hanya di Vercel |
| Email pengirim (SMTP) | Gmail `erdanyd@gmail.com`, Sandi Aplikasi "Miftah Supabase" | Erdany | Bila Sandi Aplikasi dicabut/diganti, perbarui di Supabase → Authentication → Emails → SMTP. Tanpa SMTP, undangan & atur ulang sandi gagal |
| Domain | belum ada (memakai `miftahulugohh.vercel.app`) | — | Saat dipasang: perbarui Site URL & Redirect URL Supabase |

Setelan Auth produksi (diatur 2026-10-16): Site URL `https://miftahulugohh.vercel.app`, Redirect `https://miftahulugohh.vercel.app/**`,
pendaftaran publik mati, panjang sandi minimal 10, SMTP Gmail (batas 30 email/jam), template undangan & atur ulang
dari `supabase/templates/` (tautan `token_hash` → `/auth/confirm`).

**Pemantauan (Erdany, mingguan bersamaan dengan cadangan):**
- Log aplikasi: Vercel → proyek → **Logs** (galat server, mis. "undangan gagal" / "tautan sandi gagal" beserta kodenya).
- Log Auth & database: Supabase → **Logs**. Supabase → **Advisors** (keamanan & performa) setelah setiap migrasi.
- Kuota paket gratis: Supabase → **Usage** (database 500 MB). Proyek gratis yang tidak dipakai 7 hari dapat dijeda Supabase; buka dasbor untuk mengaktifkan lagi.

## 4. Catatan latihan pemulihan

| Tanggal | Lingkungan | Data | Hasil |
|---|---|---|---|
| 2026-10-15 | Supabase lokal (Docker), Postgres 17.11 | Fiktif (seed + data uji 39 E2E) | Berhasil. 13/13 tabel jumlah baris sama (auth.users 6, profiles 5, peserta 8, kelas 5, kelas_peserta 9, jadwal 10, sesi 2, absensi_murid 4, kas 3, pembayaran 1, kategori_kas 6, audit_log 37, pengaturan 1); total honor sesi sama (Rp 177.778); 0 tabel tanpa RLS; 7 galat yang diabaikan hanya `already exists` dan hak bawaan peran internal |
| 2026-10-16 | Cadangan **produksi** (`npm run cadangan`, 32 KB) dipulihkan ke Supabase lokal yang dikosongkan (`db reset --no-seed`) | Nyata (dihapus lagi setelah latihan) | Berhasil, 0 galat. 13/13 tabel sama dengan produksi (auth.users 4, profiles 4, peserta 2, kelas 1, kelas_peserta 2, jadwal 1, sesi 1, absensi_murid 2, kas 4, pembayaran 2, kategori_kas 6, audit_log 16, pengaturan 1); saldo kas sama (Rp 222.000); 0 tabel tanpa RLS |
