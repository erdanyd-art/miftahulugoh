# CLAUDE.md — Dashboard Lembaga Miftah al-Lughah

Baca dulu: @PRD.md (sumber kebenaran kebutuhan). Jika CLAUDE.md dan PRD.md berbeda, PRD.md menang; tanyakan sebelum melanjutkan.

Rujukan (baca saat relevan, jangan dimuat semuanya sekaligus): `docs/schema.md` (skema dan SQL teruji), `docs/roadmap.md` (sprint dan kriteria selesai), `docs/security-checklist.md` (daftar periksa keamanan), `docs/landing-page.md` dan `docs/landing-reference.html` (hanya untuk Sprint 2b). Kerjakan **hanya sprint yang diminta**.

Next.js di proyek ini versi 16 (lihat `AGENTS.md`): baca panduan di `node_modules/next/dist/docs/` sebelum memakai API Next.js yang belum pasti.

## Proyek

Web dashboard administrasi sebuah lembaga kursus kecil (Bahasa Arab, Inggris, Nahwu Shorof), pengganti Google Sheets + Apps Script. Satu lembaga, bukan multi-tenant. Dikerjakan satu orang (Erdany) untuk seorang teman, jadi **sederhana dan mudah dirawat lebih penting daripada canggih**.

- **Fase 1 (sekarang):** admin dan tutor. Dashboard, kelas, peserta, jadwal, absensi per murid, honor otomatis, pembayaran, keuangan.
- **Fase 2 (jangan dikerjakan sebelum diminta):** portal peserta dan ujian CBT.

## Stack

Next.js 16 (App Router, Cache Components) + TypeScript strict, Supabase (PostgreSQL + Auth), Vercel, GitHub.
UI terpasang: Tailwind CSS v4, shadcn/ui (Radix, komponen di `components/ui/`), lucide-react, Zod, Vitest. Recharts belum dipasang (Sprint 6; tanyakan dulu).

## Perintah

Node 24 (`.nvmrc`). Supabase CLI dipasang sebagai dev-dependency, jadi selalu lewat `npx supabase ...`.
Docker Desktop di Mac ini mode per pengguna: set `PATH="$HOME/.docker/bin:$PATH"` dan `DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"` sebelum perintah Supabase.

- `npm run dev` · `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck` (`next typegen` + `tsc --noEmit`) · `npm test` (Vitest) · `npm run test:e2e` (Playwright, butuh Supabase lokal + seed)
- `npx supabase start` / `stop` / `status` (butuh Docker berjalan)
- `npx supabase migration new <nama>` · `npm run db:reset` (lokal; = `supabase db reset` + restart Kong, karena setelah reset template email lokal 404) · `npx supabase test db` (tes pgTAP di `supabase/tests/`)
- `npx supabase gen types typescript --local > lib/database.types.ts`

## Aturan kerja

1. **Rencanakan dulu, baru kode.** Untuk tugas lebih dari satu file, tulis rencana singkat dan tunggu persetujuan.
2. Kerjakan **satu sprint kecil** per tugas. Jangan membuat seluruh aplikasi sekaligus.
3. Jangan menambah fitur, tabel, atau dependensi di luar PRD tanpa bertanya.
4. Jangan overengineering: tanpa lapisan abstraksi, state manager, atau pola yang belum dibutuhkan.
5. Selesai satu tugas: jalankan lint, typecheck, dan tes; laporkan hasilnya apa adanya, termasuk yang gagal.
6. Jangan commit rahasia. `.env*` ada di `.gitignore`; sediakan `.env.example` tanpa nilai asli.

## Keamanan (wajib, tidak boleh dilonggarkan)

- **RLS aktif di setiap tabel**, tanpa pengecualian. Menyembunyikan menu atau halaman bukan pengamanan.
- Kunci `service_role` hanya di server, tidak pernah di browser, tidak pernah diberi awalan `NEXT_PUBLIC_`.
- Peran (`admin`, `tutor`) berasal dari tabel `profiles` di database, bukan dari data yang dikirim klien.
- Tutor tidak boleh membaca `pembayaran`, `kas`, atau data tutor lain; diuji di level database.
- Honor dan jendela absen dihitung/divalidasi **di server atau database**, tidak di browser. Waktu memakai jam server dan zona waktu lembaga (konfigurasi), bukan jam perangkat.
- Validasi semua input di server (Zod) dan di database (constraint). Jangan percaya data klien.
- Kata sandi hanya lewat Supabase Auth. Jangan menyimpan atau mencatat kata sandi. Hash lama dari Sheets tidak dimigrasi.
- Setiap tabel baru = migrasi + kebijakan RLS + tes RLS dalam satu perubahan.

## Database

- Perubahan skema **hanya lewat file migrasi** di `supabase/migrations/`, bukan lewat dasbor.
- Primary key `uuid`. Uang = bilangan bulat rupiah (bukan float/teks). Jam `time`, tanggal `date`.
- Foreign key dan constraint wajib; nilai terbatas (peran, jenis, status) memakai enum/check.
- Data keuangan memakai soft delete. Tindakan penting masuk `audit_log`.
- Nama tabel mengikuti PRD (`peserta`, `kelas`, `jadwal`, `sesi`, `absensi_murid`, `pembayaran`, `kas`, `profiles`, `audit_log`).

## Aturan domain yang tidak boleh salah

- **Honor sesi:** hadir ≥ 1 → honor penuh sesuai jadwal; hadir = 0 → setengah (dibulatkan ke bawah). Hitung di server saat absensi disimpan; koreksi admin dicatat di audit.
- **Jendela absen:** tutor dapat mengabsen sesi miliknya mulai jam mulai jadwal sampai pergantian tanggal. Di luar itu ditolak oleh database.
- Satu jadwal hanya satu sesi per tanggal. `hadir` dan `total` dihitung dari `absensi_murid`, tidak diketik.
- Pembayaran peserta berstatus **Lunas otomatis masuk kas** (D13): trigger `sinkron_pembayaran_kas`; kategori "Pembayaran Peserta" (`kategori_kas.otomatis`) dan baris `kas.pembayaran_id` tidak boleh ditulis manual.
- Tutor hanya boleh mengubah **tautan Meet** pada jadwal miliknya; kolom lain hanya admin.

## Tampilan dan desain

Nama tampilan: **Lembaga Miftah al-Lughah**. UI berbahasa Indonesia. Teks Arab memakai `dir="rtl"` dan kelas `font-arab` (Noto Naskh Arabic).

**Landing page publik (`/`) memakai gaya visual sendiri yang ceria**, terpisah dari dashboard; ikuti `docs/landing-page.md`, jangan menerapkan gaya itu ke dashboard dan sebaliknya. Halaman di `app/landing/` (pengunjung belum masuk di `/` di-rewrite ke sana oleh `proxy.ts`; yang sudah masuk tetap ke dashboard), komponen di `components/landing/`, gaya di `components/landing/landing.css` (kelas berawalan `lp-`, bukan CSS module: aturan Turbopack `*.css` di `next.config.ts` mematikan CSS module), isi kontak/jadwal/biaya di `lib/site-content.ts`. Bagian di bawah ini berlaku untuk **dashboard**.

**Font:** isi = Fredoka (`font-sans`, bulat dan mudah dibaca); judul h1–h3, judul kartu, angka besar, nama lembaga = Righteous (`font-judul`, hanya satu ketebalan, jangan pakai `font-bold`/`font-semibold` untuknya). Dimuat lewat `next/font` di `app/layout.tsx`.

**Referensi visual dashboard:** template dashboard kursus (bingkai gelap, sidebar ikon, panel terang membulat, kartu pastel dengan chip label, tabel daftar, satu kartu gelap dengan tombol oranye). Pakai **hanya sebagai acuan tata letak**; buat komponen sendiri dan jangan menyalin nama, logo, ilustrasi, atau aset milik pihak lain.

**Token warna** didefinisikan sekali di `app/globals.css`; komponen memakai kelas Tailwind, **jangan menaruh hex di komponen**:
- `bg-primary` navy `#13214a` (bingkai/sidebar, kartu gelap, chip label) · `bg-accent` oranye `#c2410c` (tombol sorotan, teks merek; teks putih 5.2:1)
- Kartu ringkasan: `bg-pastel-kuning`, `bg-pastel-ungu`, `bg-pastel-biru`, `bg-pastel-pink`; teks utama gelap, teks sekunder `text-pastel-muted`
- Item menu aktif: kotak kuning pastel (`bg-sidebar-accent`) dengan ikon navy
- `bg-background` abu muda (latar halaman) · `bg-card` putih (kartu)
- Status: `bg-status-lunas`/`text-status-lunas-foreground` (hijau: Lunas/Sudah), `status-menunggu` (kuning), `status-belum` (merah: Belum Lunas/Terlambat)
- Semua pasangan teks/latar lolos WCAG AA. Oranye yang lebih terang (mis. `#f2643d`) tidak boleh dipakai untuk teks. Kartu `rounded-3xl`, jarak lega.

**Pola tata letak:**
- Bingkai navy; sidebar desktop berlabel (ikon + nama menu, lebar `w-60`); konten di panel terang `rounded-[2rem]` (`components/layout/`). Di ponsel: layar penuh, menu geser berlabel (`MobileNav`, shadcn Sheet).
- Header: "Selamat datang di Miftah al-Lughah", kolom cari dengan tombol oranye, avatar + nama + peran. Judul halaman (h1) di dalam konten.
- Kartu ringkasan pastel berderet di atas, daftar/tabel dan grafik di bawah, kartu gelap di kanan pada layar lebar.
- Daftar dengan chip status berwarna.

**Pemetaan ke fitur kita:**

| Elemen template | Dipakai untuk |
|---|---|
| Kartu ringkasan | Admin: pemasukan, pengeluaran, selisih, pembayaran belum lunas. Tutor: sesi hari ini, honor bulan ini |
| Daftar "Daily Schedule" | Jadwal hari ini (tutor) / absensi tutor hari ini (admin) |
| Grafik batang | Ringkasan keuangan bulanan (admin) |
| Daftar dengan chip status | Status absensi sesi, status pembayaran |
| Kartu promosi, kartu unduh aplikasi, progres kursus | Tidak dipakai |

**Menu per peran (Fase 1)** — didefinisikan di `lib/nav.ts`:
- Admin: Dashboard, Kelas, Peserta, Jadwal, Absensi, Honor, Ujian, Pembayaran, Keuangan, Pengguna, Pengaturan, Audit
- Tutor: Dashboard, Jadwal Saya, Kelas Saya, Absensi, Honor Saya, Periksa Ujian
- Peserta (Fase 2): Beranda (daftar ujian kelasnya), Akun saya; mengerjakan di `/ujian-saya/[id]`

Ponsel diutamakan untuk tutor (absen). Semua tabel punya cari, filter, urut, dan pagination.

## Struktur proyek

```
app/                   halaman dan route (App Router); (dasbor)/ = halaman ber-sidebar
components/ui/         komponen shadcn
components/layout/     sidebar, header, menu ponsel
lib/                   auth.ts (identitas + peran, server), aksi-auth.ts (server action), supabase/server.ts, validasi/ (Zod), format, nav
proxy.ts               penyegaran sesi + alih ke /masuk (bukan otorisasi)
supabase/templates/    template email undangan & atur ulang sandi (token_hash -> /auth/confirm)
e2e/                   tes Playwright
supabase/migrations/   migrasi dan kebijakan RLS
supabase/tests/        tes RLS (pgTAP)
docs/                  schema.md, roadmap.md, security-checklist.md, uji_rls.sql, landing-page.md
```

## Konvensi

- TypeScript strict; tanpa `any` kecuali beralasan dan dikomentari.
- Nama tabel/kolom domain mengikuti PRD (bahasa Indonesia); kode umum dan komentar teknis boleh bahasa Inggris. Teks yang dilihat pengguna: bahasa Indonesia.
- Ikon (komponen) tidak boleh dikirim sebagai prop dari Server Component ke Client Component; kirim data sederhana (misalnya nama peran).
- Identitas: pakai `penggunaWajib()` / `wajibPeran()` / `penggunaStaf()` (admin atau tutor; peserta ditolak) dari `lib/auth.ts` di setiap halaman dan server action yang butuh login. Halaman/aksi untuk admin dan tutor bersama WAJIB `penggunaStaf()`, bukan `penggunaWajib()`. Fungsi database yang bercabang per peran harus menolak peran selain yang diizinkan (jangan "bukan tutor = admin").
- Akun peserta (D11): username → email sintetis `@peserta.miftah.invalid` (`lib/validasi/auth.ts`), dibuat admin di halaman peserta (`lib/aksi-akun-peserta.ts`), sandi awal acak tampil sekali, `profiles.wajib_ganti_sandi` memaksa ke `/ganti-sandi`. Akun peserta tidak tampil di menu Pengguna. Pembacaan sesi harus di dalam `<Suspense>` (Cache Components).
- Halaman admin baru: panggil `wajibPeran("admin")` di server; menyembunyikan menu bukan pengaman.
- `service_role` HANYA di `lib/supabase/admin.ts` (`server-only`), hanya untuk API Auth admin, hanya setelah `wajibPeran("admin")`. Data tabel tetap ditulis dengan sesi pengguna (RLS + audit).
- ID dari klien divalidasi `z.guid()` (bukan `z.uuid()`: ID seed fiktif bukan UUID RFC).
- Tabel: pola cari/filter/urut/halaman lewat parameter URL (`lib/tabel.ts`, `components/tabel.tsx`); form filter memakai GET.
- Setelah mutasi di server action panggil `refresh()` dari `next/cache` agar tampilan memuat data baru.
- Form dengan isian memakai `useFormAksi` (`components/use-form-aksi.ts`), bukan `<form action>` langsung: React mereset form setelah aksi, sehingga isian (terutama dropdown) hilang saat server menolak.
- Waktu lembaga: `lib/waktu.ts` + `waktuLembaga()` (zona dari `pengaturan`). Hanya untuk tampilan; jendela absen dan honor ditegakkan `simpan_absensi()`.
- Pesan galat fungsi database diterjemahkan di `lib/pesan-galat.ts`.
- Keuangan: setiap query `kas`/`pembayaran` WAJIB `.is("dihapus_pada", null)`; "Hapus" = isi `dihapus_pada`. Jenis kas diambil dari kategori di server. Ekspor CSV lewat `lib/csv.ts` (anti injeksi formula).
- Grafik: tanpa pustaka (`components/keuangan/grafik-bulanan.tsx`); warna `bg-chart-pemasukan` (#3b6fd4) / `bg-chart-pengeluaran` (#e8590c), divalidasi skrip dataviz.
- Header keamanan & CSP ada di `next.config.ts` (tanpa nonce). Origin Supabase hanya di `connect-src` (unggah audio lewat tautan unggah sekali pakai) dan `media-src` (putar audio lewat tautan bertanda tangan). Sumber eksternal baru (skrip, font, API) harus ditambahkan ke CSP secara sadar.
- Halaman baru: tambahkan ke `e2e/kualitas.spec.ts` (axe WCAG AA, galat konsol/CSP, geser horizontal di 390px).
- Ujian (Fase 2): `lib/aksi-ujian.ts`, `lib/data/ujian.ts`, `components/ujian/`. Kunci jawaban hanya di `soal_kunci` (admin saja, jangan pernah dikirim ke peserta). Soal + kunci disimpan lewat `simpan_soal()`. Audio: bucket privat `audio-ujian`; browser mengunggah langsung ke Storage (batas body Vercel 4,5 MB), server membuat tautan unggah setelah `wajibPeran("admin")` lalu mencatat ukuran dari Storage. Peserta: `lib/data/ujian-peserta.ts`, `lib/aksi-ujian-peserta.ts`, `components/ujian/kerjakan.tsx`; peserta tidak menulis tabel langsung (hanya `mulai_ujian`/`simpan_jawaban`/`selesai_ujian`), status & sisa waktu dihitung dari jam database, timer klien hanya tampilan. Penilaian: `lib/data/penilaian.ts`, `lib/aksi-penilaian.ts`, `components/ujian/hasil-ujian.tsx` (admin `/ujian/[id]/hasil`, tutor `/periksa-ujian/[id]`); akses lewat fungsi database `boleh_periksa` (tutor hanya kelas yang diampu); peserta hanya `nilai_saya()` setelah diumumkan. Teks soal pakai `TeksSoal` (dir="auto", huruf Arab diperbesar); font utama punya cadangan Naskh untuk huruf Arab.
- Data master tidak dihapus permanen: peserta, kelas, dan jadwal dinonaktifkan lewat centang "Aktif" (riwayat sesi dan honor tetap utuh).
- E2E: pakai locator berbasis role/`exact` (Next menyimpan halaman sebelumnya tersembunyi lewat Activity) dan tunggu `networkidle` sebelum mengisi form yang di-stream.
- Commit kecil dan fokus, pesan jelas. Satu sprint = satu cabang/PR.
- Saat ragu soal kebutuhan, **tanya**; jangan mengarang.
