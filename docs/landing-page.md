# docs/landing-page.md — Spesifikasi Landing Page Publik

Versi: 0.1 · Tanggal: 2026-10-16 · Mengacu pada PRD.md v0.10 (bagian 5.8) dan CLAUDE.md

> **Isi (teks dan struktur program) di berkas ini sudah digantikan `docs/landing-konten.md` (2026-10-19, dari brosur resmi).** Bagian visual, aksesibilitas, SEO, implementasi, dan gerak 3D di berkas ini tetap berlaku.

## 1. Tujuan dan lingkup

Halaman publik di rute `/` yang memperkenalkan Lembaga Miftah al-Lughah dan tiga programnya, dengan dua tombol utama:
- **Daftar**: membuka WhatsApp lembaga (pendaftaran lewat WhatsApp, tidak ada formulir).
- **Masuk**: tautan ke `/masuk` untuk admin dan tutor.

Halaman ini **statis**: tidak membaca database, tidak memakai kunci apa pun, tidak butuh login. Tidak ada blog, multi-halaman, formulir, atau testimoni. Gerak 3D ditambahkan atas permintaan pemilik proyek (2026-10-16), lihat bagian 13.

## 2. Sumber kebenaran visual

- **`docs/landing-reference.html`** adalah desain yang sudah disetujui pemilik proyek. Buka di browser (atau ambil tangkapan layar dengan Playwright pada lebar 360, 390, 768, 1024, 1440) dan jadikan acuan. Nilai ukuran, warna, dan jarak di berkas itu adalah acuan; **jangan menyalinnya mentah ke produksi**, implementasikan sebagai komponen sesuai bagian 8.
- Gaya (kertas berkotak, stiker, doodle, warna cerah) berasal dari arahan "fun" pemilik proyek. Semua ilustrasi dibuat sendiri (SVG). **Jangan memakai ilustrasi, aset, atau teks dari situs lain.**
- Dashboard (di balik login) tetap memakai gaya sendiri di CLAUDE.md. Landing page dan dashboard **tidak** berbagi tampilan, hanya berbagi token warna biru tua sebagai identitas.

## 3. Token desain

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `navy` | `#0E1E5B` | teks, garis, tombol gelap, footer, pita |
| `primary` | `#4A5BEA` | panel adegan hero, kartu program Inggris |
| `accent` | `#D7F75B` (limau) | tombol utama, stiker, kartu aksen |
| `periwinkle` | `#C9CFFF` | kartu pendukung |
| `cream` | `#F8FAE6` | latar halaman |
| `grid` | `#E2EBA6` | garis kertas kotak (kotak 44px, garis 1,5px) |
| `white` | `#FFFFFF` | kartu, pil, balon |

Opsi alternatif yang disiapkan di desain (tweak): `accent` → `#FFD84D`, `#FF9BC2`, `#7FE3D0`; `primary` → `#5B4BDB`, `#0B7A75`. Cukup satu tempat untuk mengganti (variabel tema).

**Tipografi:** Bricolage Grotesque (400, 600, 800) untuk teks Latin; Amiri (400, 700) untuk teks Arab. Muat dengan `next/font` (di-*host* sendiri saat build; **tanpa permintaan ke Google saat runtime**).
- Judul hero: `clamp(38px, 6.4vw, 78px)`, berat 800, huruf kapital, `letter-spacing: -0.025em`, tinggi baris 1,04.
- Judul seksi: `clamp(32px, 5vw, 56px)`, berat 800, huruf kapital.
- Badan teks 17–19px, tinggi baris 1,55.

**Bentuk:** kartu radius 28–44px; pil `999px`; pil stiker berbingkai `2,5px dashed navy` dengan rotasi kecil (−3° sampai +5°); lebar isi maksimum 1200px dengan padding 24px.

## 4. Struktur dan isi

Gunakan teks berikut apa adanya (bahasa Indonesia). Teks dalam `[KURUNG KOTAK]` adalah placeholder (bagian 5).

**Navigasi:** logo (lingkaran navy berisi ikon kunci limau) + "Miftah al-Lughah"; pil navigasi putih: Program (`#program`), Cara belajar (`#cara`), Daftar (`#daftar`); tombol "Masuk" (navy) → `/masuk`.

**Hero** (dua kolom, melipat jadi satu kolom di layar sempit)
- Stiker: "Kelas online" (limau) dan "via Google Meet" (putih).
- H1: "Buka **kunci** bahasa Arab & Inggrismu" (kata "kunci" di dalam pil limau berbingkai putus-putus, miring −2,5°).
- Paragraf: "Kelas Bahasa Arab, Bahasa Inggris, dan Nahwu Shorof bersama tutor lembaga. Pilih program, terima jadwal, langsung belajar."
- Tombol utama "Daftar sekarang" (pil limau + lingkaran navy berpanah) → WhatsApp; tautan teks "Lihat program" → `#program`.
- Adegan kanan (dekoratif, `aria-hidden`): panel biru berkisi, kunci limau besar miring, balon "مرحبا!" (putih) dan "Hello!" (limau), tiga ubin huruf أ ب ت, bintang berkilau, garis zigzag, lingkaran putus-putus.
- Tiga kartu fakta: "Online via Google Meet" (Belajar dari rumah, kapan pun sesuai jadwal.), "Jadwal tetap tiap pekan" (Hari dan jam jelas, mudah diatur.), "Kehadiran dicatat tutor" (Setiap pertemuan, setiap peserta.).

**Pita miring** (dekoratif): navy, teks limau, berulang: Bahasa Arab ✦ English ✦ نحو وصرف ✦ مفتاح اللغة. Tanda ✦ digambar sebagai SVG bintang, bukan karakter.

**Program** (`#program`): judul "Pilih kelasmu" + stiker "3 program". Tiga kartu:
1. Label "العربية" · **Bahasa Arab Dasar** · "Mulai dari dasar: membaca, kosakata, dan kalimat sederhana untuk percakapan sehari-hari." (kartu limau, huruf besar samar "ع" sebagai hiasan)
2. Label "English" · **Bahasa Inggris Percakapan** · "Berlatih berbicara dan memahami percakapan sehari-hari agar lebih percaya diri." (kartu biru, teks putih, hiasan "Aa")
3. Label "نحو وصرف" · **Nahwu Shorof** · "Memahami kaidah tata bahasa dan perubahan kata Arab agar dapat membaca teks dengan benar." (kartu periwinkle, hiasan "ن")

Setiap kartu menutup dengan dua pil: jadwal `[HARI & JAM]` dan biaya `[BIAYA / BULAN]`.

**Cara belajar** (`#cara`): judul "Tiga langkah, langsung belajar"; tiga kartu putih sedikit miring dengan nomor dalam lingkaran navy:
1. **Daftar**: "Hubungi kami dan pilih program yang cocok untukmu."
2. **Terima jadwal & tautan**: "Kamu mendapat jadwal pertemuan dan tautan Google Meet untuk kelasmu."
3. **Belajar bersama tutor**: "Ikuti pertemuan tiap pekan. Kehadiranmu dicatat oleh tutor."

**Pendaftaran** (`#daftar`): blok limau besar. Judul "Siap masuk kelas?"; "Hubungi kami untuk memilih program dan jadwal yang paling cocok."; tombol navy "Chat WhatsApp" → WhatsApp. Tiga baris kontak: WhatsApp `[NOMOR WHATSAPP]`, Instagram `[@AKUN INSTAGRAM]`, Alamat `[ALAMAT / KOTA]`.

**Footer:** "© 2026 Lembaga Miftah al-Lughah" dan tautan "Masuk (admin dan tutor)" → `/masuk`.

## 5. Placeholder dan konfigurasi konten

Semua teks yang belum diketahui disimpan di **satu berkas konfigurasi konten** (`lib/site-content.ts`), agar teman pemilik lembaga atau pengembang bisa mengisinya tanpa menyentuh komponen:

```ts
export const siteContent = {
  waNumber: "",        // hanya angka dengan kode negara, mis. 62812...
  waMessage: "Assalamu'alaikum, saya ingin mendaftar di Lembaga Miftah al-Lughah.", // usulan, boleh diganti
  instagram: "",       // tanpa @
  address: "",
  programs: [
    { key: "arab",    jadwal: "", biaya: "" },
    { key: "inggris", jadwal: "", biaya: "" },
    { key: "nahwu",   jadwal: "", biaya: "" },
  ],
};
```

Aturan tampilan: **bila nilai kosong, tampilkan pil placeholder bergaris putus-putus** (misalnya `[NOMOR WHATSAPP]`) dan jadikan tombol WhatsApp tidak aktif secara visual dengan tautan `#daftar`; **bila terisi, tampilkan nilai asli** dan tautan WhatsApp `https://wa.me/<waNumber>?text=<waMessage ter-encode>`. Jangan pernah menaruh nomor atau akun contoh yang tampak asli.

## 6. Ilustrasi (semua SVG buatan sendiri)

Pisahkan menjadi komponen kecil di `components/landing/art/`: `Key`, `Sparkle`, `Squiggle`, `SpeechBubble`, `LetterTile`, `Band`. Semua dekoratif: `aria-hidden="true"`.

Kunci (viewBox `0 0 210 100`; teknik: bentuk digambar dua kali, pertama navy dengan `stroke-width: 9` sebagai kontur, lalu diisi limau; lubang berwarna `primary`):

```html
<svg viewBox="0 0 210 100" aria-hidden="true">
  <g fill="#0E1E5B" stroke="#0E1E5B" stroke-width="9" stroke-linejoin="round">
    <circle cx="44" cy="50" r="34"/><rect x="70" y="43" width="128" height="14" rx="7"/>
    <rect x="150" y="55" width="14" height="24" rx="5"/><rect x="174" y="55" width="14" height="17" rx="5"/>
  </g>
  <g fill="#D7F75B">
    <circle cx="44" cy="50" r="34"/><rect x="70" y="43" width="128" height="14" rx="7"/>
    <rect x="150" y="55" width="14" height="24" rx="5"/><rect x="174" y="55" width="14" height="17" rx="5"/>
  </g>
  <circle cx="44" cy="50" r="12" fill="#4A5BEA" stroke="#0E1E5B" stroke-width="4.5"/>
</svg>
```

Bintang berkilau (viewBox `0 0 24 24`): `M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z`.
Zigzag (viewBox `0 0 100 24`, stroke putih 3,5, `stroke-linecap: round`): `M3 12 Q 14 0 25 12 T 47 12 T 69 12 T 91 12`.
Ekor balon bicara: kotak 16px berotasi 45° dengan dua sisi bergaris navy 3px, ditaruh di tepi balon.

Elemen lain (kisi, pil putus-putus, huruf besar samar di kartu) cukup dengan CSS.

## 7. Responsif dan aksesibilitas

**Responsif**
- Tata letak cair: hero dan kartu memakai flex-wrap dengan `flex: 1 1 <min>`; tidak bergantung pada breakpoint khusus. Periksa di 360, 390, 768, 1024, dan 1440 px.
- Tidak boleh ada gulir horizontal di lebar berapa pun (pita miring dan hiasan yang meluber harus terpotong oleh pembungkus dengan `overflow-x: clip`).
- Hiasan absolut di adegan hero memakai persentase di dalam panel; pastikan tidak menutupi teks di layar sempit.
- Target sentuh minimal 44px (pil navigasi, tombol).

**Aksesibilitas**
- Urutan judul: satu `h1` (hero), `h2` per seksi, `h3` per kartu.
- Teks Arab memakai `lang="ar" dir="rtl"`; seluruh dokumen `lang="id"`.
- Hiasan (adegan, pita, huruf samar, ikon) `aria-hidden="true"`; tombol hanya berupa `<a>` atau `<button>` sungguhan; fokus keyboard terlihat jelas (kontur 3px navy).
- Kontras: navy di atas limau dan krem sangat tinggi; teks putih di atas `#4A5BEA` kira-kira 5:1; teks `#0E1E5B` di atas `#C9CFFF` memadai. **Ukur ulang dengan alat kontras** dan perbaiki bila di bawah 4,5:1 (3:1 untuk teks besar).
- Gerak 3D (bagian 13) dimatikan seluruhnya untuk `prefers-reduced-motion: reduce`.

## 8. Catatan implementasi Next.js

- Rute `app/page.tsx` sebagai **Server Component**; tidak perlu JavaScript sisi klien. Komponen di `components/landing/`.
- Warna dan radius sebagai token tema (Tailwind theme/CSS variable), bukan hex di dalam komponen (sesuai CLAUDE.md).
- Font lewat `next/font` (Bricolage Grotesque dan Amiri, subset `latin` dan `arabic`).
- Metadata (draf, boleh disesuaikan): judul "Lembaga Miftah al-Lughah — Kursus Bahasa Arab & Inggris Online"; deskripsi "Kelas Bahasa Arab, Bahasa Inggris, dan Nahwu Shorof secara online lewat Google Meet."; Open Graph dasar; URL kanonik dari `NEXT_PUBLIC_SITE_URL` (isi setelah domain ditetapkan).
- **Mesin pencari:** hanya `/` yang boleh diindeks. `/masuk` dan seluruh halaman dashboard memakai `noindex`. Sediakan `robots.ts` dan `sitemap.ts` yang hanya memuat `/`.
- Tautan eksternal (WhatsApp, Instagram) memakai `target="_blank"` dengan `rel="noopener noreferrer"`.
- Tombol "Masuk" hanya tautan ke `/masuk`; **tidak ada formulir login di landing page**.
- Target kinerja (ukur dengan Lighthouse mobile): Performance ≥ 90, Accessibility ≥ 95. Tanpa gambar raster besar.

## 9. Kriteria selesai

- Tampilan di 360, 390, 768, 1024, dan 1440 px setara dengan `docs/landing-reference.html` (bandingkan dengan tangkapan layar Playwright; laporkan perbedaan yang disengaja).
- Tidak ada gulir horizontal; teks Arab tampil benar dari kanan ke kiri.
- Placeholder muncul saat konfigurasi kosong dan nilai asli muncul saat terisi (uji keduanya).
- Tombol "Masuk" membuka `/masuk`; tautan WhatsApp terbentuk benar dari konfigurasi.
- Lint, typecheck, dan tes lulus; skor Lighthouse memenuhi target; item "G. Halaman publik" di `docs/security-checklist.md` terisi dengan bukti.

## 10. Sengaja belum ada

Foto tutor, testimoni, harga nyata, jumlah murid, sertifikasi, formulir pendaftaran, blog, dan versi bahasa lain. **Jangan mengarang** angka, testimoni, atau klaim kualifikasi; tambahkan hanya bila pemilik lembaga menyediakan datanya.

## 11. Data yang masih dibutuhkan dari pemilik lembaga

Nomor WhatsApp, akun Instagram, alamat atau kota, jadwal dan biaya tiap program, konfirmasi nama dan deskripsi program (deskripsi di atas adalah draf), logo asli bila ada, dan nama domain.

## 12. Catatan implementasi (diperbarui 2026-10-19: situs terpisah)

- **Landing adalah aplikasi sendiri** di folder `landing/` (Next.js 16, tanpa Tailwind, tanpa Supabase), dipasang sebagai proyek Vercel terpisah dengan Root Directory `landing`. Dashboard tidak memuat landing apa pun (rewrite di `proxy.ts` sudah dicabut) dan seluruhnya `noindex`.
- Tombol "Masuk" adalah tautan ke `/masuk` di dashboard (`NEXT_PUBLIC_DASHBOARD_URL`; bawaan `https://miftahulugohh.vercel.app`, lokal `http://localhost:3000`).
- Gaya di `landing/app/landing.css` (kelas `lp-*`), token warna di `:root`. Tanpa reset CSS, sama seperti acuan (content-box, tinggi baris bawaan).
- `landing/vercel.json` (`ignoreCommand`) hanya mem-*build* proyek landing bila folder `landing/` berubah. CI punya job `landing` sendiri (lint, typecheck, tes unit, build, E2E).
- **Menu ponsel (2026-10-20):** di bawah 768 px menu pil diganti tombol ☰ yang membuka sidebar dari kanan (`landing/components/menu-ponsel.tsx`: tutup dengan ✕, Esc, ketuk latar, atau memilih tautan; fokus tertahan di panel). Header ponsel satu baris: logo asli + nama + "Program Bahasa Arab".
- Perbedaan yang disengaja dari acuan: (1) tautan menu minimal 44 px (target sentuh); (2) tombol WhatsApp tampak tidak aktif (garis putus-putus) selama nomor kosong; (3) huruf hiasan samar dirender lewat CSS `::before` agar tidak dihitung sebagai teks oleh pemeriksa kontras.

## 13. Gerak 3D (2026-10-16, permintaan pemilik proyek)

Tanpa pustaka tambahan: CSS (`components/landing/landing.css`, bagian "GERAK 3D") dan satu komponen klien kecil `components/landing/gerak.tsx`.
- **Adegan hero = panggung 3D:** kisi diam di belakang; lapisan depan bergoyang pelan, objek punya kedalaman (`lp-z-*`) sehingga terasa parallax. Kunci melayang lalu berputar pada porosnya (membuka gembok), ubin huruf berputar balik bergantian, balon bicara melayang, bintang berkelip, lingkaran putus-putus berputar.
- **Kursor:** adegan dan kartu (`data-tilt`, nilai = derajat maksimum) miring mengikuti kursor; hanya mouse/pen. Di ponsel gerak tetap ada lewat animasi otomatis dan scroll.
- **Scroll:** kartu fakta, program, langkah, dan blok pendaftaran berputar masuk saat muncul (CSS scroll-driven `animation-timeline: view()`; browser yang belum mendukung menampilkan kartu diam).
- **Lainnya:** pita berjalan terus, "KUNCI" sesekali bergoyang, tombol timbul (terangkat saat disorot, tertekan saat diklik), kartu terangkat dengan bayangan tegas saat disorot.
- Hanya `transform`/`translate`/`rotate`/`scale` (tanpa `opacity`): tata letak (CLS 0) dan kontras tidak berubah. Lighthouse mobile tetap Performance 86–87, Accessibility 100.
- Diuji E2E: animasi berjalan, kursor mengisi `--rx/--ry`, dan nol animasi saat `reducedMotion: reduce`.
