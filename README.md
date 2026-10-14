# Lembaga Miftah al-Lughah — Dashboard

Dashboard administrasi untuk admin dan tutor Lembaga Miftah al-Lughah (pengganti Google Sheets).
Kebutuhan: [PRD.md](PRD.md) · Skema: [docs/schema.md](docs/schema.md) · Rencana kerja: [docs/roadmap.md](docs/roadmap.md) · Keamanan: [docs/security-checklist.md](docs/security-checklist.md)

## Prasyarat

- Node.js 24 (lihat `.nvmrc`)
- Docker Desktop (atau OrbStack) yang sedang berjalan, untuk Supabase lokal

## Menjalankan di komputer sendiri

```bash
npm install
npx supabase start          # menyalakan Supabase lokal (Docker), mencetak URL dan kunci
cp .env.example .env.local  # lalu isi dari keluaran `npx supabase status`
npm run dev                 # http://localhost:3000
```

Akun contoh (data fiktif dari `supabase/seed.sql`, hanya lokal), kata sandi `dev-lokal-123`:

| Email | Peran |
|---|---|
| `admin@contoh.test` | admin |
| `tutor1@contoh.test`, `tutor2@contoh.test` | tutor |
| `tutor3@contoh.test` | tutor nonaktif (harus ditolak) |
| `tanpaprofil@contoh.test` | akun Auth tanpa profil (harus ditolak) |

Email lokal (misalnya tautan lupa kata sandi) terlihat di Mailpit: http://127.0.0.1:54324

Docker Desktop di Mac ini terpasang per pengguna; bila perintah `docker` tidak dikenal, jalankan dulu:
`export PATH="$HOME/.docker/bin:$PATH" DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"`

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test                    # tes unit (Vitest)
npx supabase test db        # tes RLS/aturan bisnis (pgTAP), butuh Supabase lokal menyala
npm run test:e2e            # Playwright (login per peran), butuh Supabase lokal + seed
npm run build
```

CI GitHub Actions menjalankan lint, typecheck, tes unit, build, `supabase test db`, dan E2E pada setiap PR.

## Membuat admin pertama (produksi)

Pendaftaran publik dimatikan, jadi admin pertama dibuat manual satu kali (lihat `docs/schema.md` bagian 8):

1. Di dasbor Supabase produksi: **Authentication → Users → Add user → Create new user**. Isi email admin, isi kata sandi acak panjang (tidak perlu dicatat), centang **Auto Confirm User**. Catat `id` (UUID) pengguna itu.
2. Di **SQL Editor**, jalankan sekali:
   ```sql
   insert into public.profiles (id, nama, peran) values ('<UUID-PENGGUNA>', 'Nama Admin', 'admin');
   ```
3. Admin membuka situs, klik **Lupa kata sandi?**, lalu menetapkan kata sandinya sendiri (minimal 10 karakter) dari tautan di email.
4. Pastikan **Authentication → Sign In / Providers → Allow new users to sign up** dimatikan.
5. Tutor dan admin berikutnya dibuat dari halaman **Pengguna** (Sprint 3).

## Rahasia

`.env*` tidak pernah di-commit (kecuali `.env.example` yang kosong). `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server dan tidak boleh berawalan `NEXT_PUBLIC_`.
