# docs/uat.md — Uji penerimaan (UAT) Fase 1

Dilakukan bersama pemilik lembaga di https://miftahulugohh.vercel.app memakai data nyata secukupnya.
Tandai tiap skenario **OK** / **Masalah** dan tulis catatan singkat. Masalah dibagi: *perbaikan cepat* atau *Fase 2/nanti*.

## Admin (laptop)

| # | Skenario | Hasil | Catatan |
|---|---|---|---|
| 1 | Masuk, lihat Dashboard: absensi tutor hari ini, pemasukan/pengeluaran/selisih bulan ini, jumlah Belum Lunas | | |
| 2 | Tambah tutor lewat **Pengguna → Tambah**; tutor menerima email undangan dan membuat kata sandi | | |
| 3 | Buat kelas, tambah peserta satu per satu, lalu **Impor CSV** beberapa peserta sekaligus | | |
| 4 | Atur anggota kelas; buat jadwal (tutor, hari, jam, honor, tautan Meet) | | |
| 5 | Catat pembayaran **Belum Lunas**, lalu ubah jadi **Lunas**: muncul sebagai pemasukan kas "Pembayaran Peserta" | | |
| 6 | Catat kas pengeluaran (Operasional) dan **Honor Tutor** (pilih tutor); saldo honor tutor berkurang | | |
| 7 | Rekap bulanan dan ekspor CSV (kas, pembayaran, honor) terbuka benar di Excel/Sheets | | |
| 8 | Koreksi honor satu sesi dan kunci sesi; perubahan tercatat di **Audit** | | |
| 9 | Nonaktifkan lalu aktifkan lagi seorang tutor | | |
| 10 | Ganti kata sandi sendiri lewat **Akun saya** | | |

## Tutor (ponsel)

| # | Skenario | Hasil | Catatan |
|---|---|---|---|
| 11 | Masuk dari ponsel; Dashboard menampilkan jadwal hari ini | | |
| 12 | Absen sesi hari ini setelah jam mulai: centang murid hadir, simpan; honor otomatis (hadir ≥ 1 penuh, 0 setengah) | | |
| 13 | Coba absen sebelum jam mulai: ditolak | | |
| 14 | Ubah tautan Meet jadwal sendiri | | |
| 15 | Lihat **Honor Saya** per bulan dan saldo honor | | |
| 16 | Tutor tidak bisa membuka Keuangan/Pembayaran (ketik alamatnya langsung: ditolak) | | |
| 17 | Lupa kata sandi dari halaman masuk: email atur ulang diterima dan berhasil | | |

## Pertanyaan terbuka untuk pemilik lembaga (PRD §10)

1. Sesi tanpa peserta terdaftar (total 0): honor penuh atau setengah? (Sekarang: setengah, karena hadir = 0.)
2. "Atur pembayaran": perlu tagihan SPP per peserta/kelas, atau cukup mencatat pembayaran seperti sekarang?
3. Perlu domain sendiri (mis. miftahullughah.com, berbayar ±Rp150–200 rb/tahun) atau cukup alamat vercel.app?
4. Perlu verifikasi dua langkah (TOTP) untuk akun admin?
