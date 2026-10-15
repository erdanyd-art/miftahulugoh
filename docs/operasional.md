# docs/operasional.md — Panduan Operasional

Versi: 0.1 (Sprint 7) · Bagian bertanda **[Sprint 8]** dilengkapi saat aplikasi dipasang di produksi.

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

### 1.3 Produksi **[Sprint 8]**

Langkah yang direncanakan (dipastikan ulang terhadap dokumentasi Supabase terbaru saat Sprint 8, karena fitur cadangan bergantung paket):

1. Periksa cadangan otomatis di dasbor Supabase (**Database → Backups**) sesuai paket yang dipakai.
2. Bila tidak memadai (mis. paket gratis), jadwalkan cadangan mandiri mingguan dengan `pg_dump` ke penyimpanan terpisah (bukan repositori Git — repositori ini publik):
   `pg_dump "<connection string Supabase, dari dasbor>" -Fc -n public -n auth -f cadangan-YYYY-MM-DD.dump`
3. Pemulihan: buat proyek Supabase baru (atau database kosong), terapkan migrasi `supabase/migrations/`, lalu `pg_restore --data-only` dari berkas cadangan. Lakukan **satu kali latihan** di proyek uji sebelum data nyata masuk, catat hasilnya di bagian 4.

Berkas cadangan berisi data pribadi peserta dan hash kata sandi: simpan terenkripsi, akses terbatas, dan hapus berkas lama sesuai kebutuhan.

## 2. Tugas rutin admin

- **Menambah tutor/admin:** menu **Pengguna → Tambah pengguna**. Pengguna menerima email undangan dan membuat kata sandi sendiri.
- **Pengguna lupa kata sandi:** pengguna klik **Lupa kata sandi?** di halaman masuk, atau admin membuka pengguna lalu **Kirim tautan buat kata sandi**.
- **Tutor berhenti:** **Pengguna → (nama) → Nonaktifkan akun**. Akses langsung terputus; riwayat absensi dan honor tetap utuh. Jangan menghapus akun di dasbor Supabase.
- **Mengganti kata sandi admin:** keluar, lalu **Lupa kata sandi?** dengan email admin.
- **Zona waktu lembaga:** menu **Pengaturan**. Zona salah membuat tutor gagal absen.
- **Sesi absensi perlu dikoreksi:** **Absensi → (sesi) →** koreksi honor / kunci sesi / ubah absensi; semua tercatat di **Audit**.

## 3. Pemantauan **[Sprint 8]**

- Log aplikasi: dasbor Vercel (**Logs**). Galat yang dilihat pengguna hanya pesan umum + kode; cocokkan kode itu dengan log.
- Log database & Auth: dasbor Supabase (**Logs**).
- Penanggung jawab dan frekuensi pemeriksaan: ditetapkan saat serah terima.
- Pemilik akun GitHub, Supabase, Vercel, domain, dan cara pemulihan aksesnya: ditetapkan saat serah terima.

## 4. Catatan latihan pemulihan

| Tanggal | Lingkungan | Data | Hasil |
|---|---|---|---|
| 2026-10-15 | Supabase lokal (Docker), Postgres 17.11 | Fiktif (seed + data uji 39 E2E) | Berhasil. 13/13 tabel jumlah baris sama (auth.users 6, profiles 5, peserta 8, kelas 5, kelas_peserta 9, jadwal 10, sesi 2, absensi_murid 4, kas 3, pembayaran 1, kategori_kas 6, audit_log 37, pengaturan 1); total honor sesi sama (Rp 177.778); 0 tabel tanpa RLS; 7 galat yang diabaikan hanya `already exists` dan hak bawaan peran internal |
