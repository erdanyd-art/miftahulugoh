# CLAUDE.md — Dashboard Lembaga Miftah al-Lughah

Baca dulu: @PRD.md (sumber kebenaran kebutuhan). Jika CLAUDE.md dan PRD.md berbeda, PRD.md menang; tanyakan sebelum melanjutkan.

Rujukan (baca saat relevan, jangan dimuat semuanya sekaligus): `docs/schema.md` (skema dan SQL teruji), `docs/roadmap.md` (sprint dan kriteria selesai), `docs/security-checklist.md` (daftar periksa keamanan). Kerjakan **hanya sprint yang diminta**.

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

- `npm run dev` · `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck` (`next typegen` + `tsc --noEmit`) · `npm test` (Vitest)
- `npx supabase start` / `stop` / `status` (butuh Docker berjalan)
- `npx supabase migration new <nama>` · `npx supabase db reset` (lokal) · `npx supabase test db` (tes pgTAP di `supabase/tests/`)
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
- Pembayaran peserta **tidak** otomatis masuk kas (disengaja).
- Tutor hanya boleh mengubah **tautan Meet** pada jadwal miliknya; kolom lain hanya admin.

## Tampilan dan desain

Nama tampilan: **Lembaga Miftah al-Lughah**. UI berbahasa Indonesia. Teks Arab memakai `dir="rtl"` dan kelas `font-arab` (Noto Naskh Arabic).

**Referensi visual:** sebuah template dashboard pendidikan (sidebar gelap, kartu putih membulat di atas latar terang). Pakai **hanya sebagai acuan tata letak**; buat komponen sendiri dan jangan menyalin nama, logo, ilustrasi, atau aset milik pihak lain.

**Token warna** didefinisikan sekali di `app/globals.css`; komponen memakai kelas Tailwind, **jangan menaruh hex di komponen**:
- `bg-primary` navy `#13214a` (sidebar, tombol utama) · `bg-accent` hijau limau `#c6f135` (item aktif, sorotan; kontras 11.9:1 terhadap navy)
- `bg-background` abu muda (latar halaman) · `bg-card` putih (kartu)
- Status: `bg-status-lunas`/`text-status-lunas-foreground` (hijau: Lunas/Sudah), `status-menunggu` (kuning), `status-belum` (merah: Belum Lunas/Terlambat)
- Semua pasangan teks/latar lolos WCAG AA. Kartu `rounded-2xl`, `shadow-sm`, jarak lega.

**Pola tata letak:**
- Sidebar kiri gelap dengan logo di atas, menu dengan ikon, item aktif berupa pil beraksen (`components/layout/`). Di ponsel: menu geser (`MobileNav`, shadcn Sheet).
- Header: salam dan nama pengguna, kolom cari, avatar.
- Kartu ringkasan berderet di atas, daftar dan grafik di bawah, panel samping di kanan pada layar lebar.
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
- Admin: Dashboard, Kelas, Peserta, Jadwal, Absensi, Honor, Pembayaran, Keuangan, Pengguna, Pengaturan, Audit
- Tutor: Dashboard, Jadwal Saya, Kelas Saya, Absensi, Honor Saya

Ponsel diutamakan untuk tutor (absen). Semua tabel punya cari, filter, urut, dan pagination.

## Struktur proyek

```
app/                   halaman dan route (App Router); (dasbor)/ = halaman ber-sidebar
components/ui/         komponen shadcn
components/layout/     sidebar, header, menu ponsel
lib/                   utilitas (format, nav), nanti klien Supabase dan skema Zod
supabase/migrations/   migrasi dan kebijakan RLS
supabase/tests/        tes RLS (pgTAP)
docs/                  schema.md, roadmap.md, security-checklist.md, uji_rls.sql
```

## Konvensi

- TypeScript strict; tanpa `any` kecuali beralasan dan dikomentari.
- Nama tabel/kolom domain mengikuti PRD (bahasa Indonesia); kode umum dan komentar teknis boleh bahasa Inggris. Teks yang dilihat pengguna: bahasa Indonesia.
- Ikon (komponen) tidak boleh dikirim sebagai prop dari Server Component ke Client Component; kirim data sederhana (misalnya nama peran).
- Commit kecil dan fokus, pesan jelas. Satu sprint = satu cabang/PR.
- Saat ragu soal kebutuhan, **tanya**; jangan mengarang.
